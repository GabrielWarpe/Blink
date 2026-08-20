/**
 * Testes das funções puras da Edge Function `generate-cards-doc`.
 *
 * São as peças que protegem o usuário de card ruim — seleção de figuras,
 * validador do output e a métrica de viés das alternativas. Rodam contra o
 * CÓDIGO REAL (o arquivo é transpilado e avaliado aqui), não contra uma cópia,
 * então não há como o teste passar enquanto a função de verdade quebra.
 *
 * Não chama rede nem IA: roda em menos de um segundo e não custa nada.
 *
 *     node scripts/test-generate-cards.js
 */

const ts = require('typescript');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SOURCE = path.join(
  __dirname,
  '..',
  'supabase/functions/generate-cards-doc/index.ts',
);

// Tira o import npm: e o Deno.serve final — o resto do módulo avalia normal.
const src = fs
  .readFileSync(SOURCE, 'utf8')
  .replace(/^import .*$/m, '')
  .replace(/Deno\.serve\([\s\S]*$/, '');

// Checagem de sintaxe do arquivo INTEIRO antes de qualquer coisa. O
// `tsconfig.json` do app exclui `supabase/functions`, então `npx tsc --noEmit`
// passa mesmo com o arquivo quebrado — e o erro só aparece no deploy. Já
// aconteceu: uma crase dentro do prompt fechou o template literal.
const sintaxe = ts.transpileModule(fs.readFileSync(SOURCE, 'utf8'), {
  reportDiagnostics: true,
  compilerOptions: { target: ts.ScriptTarget.ESNext },
}).diagnostics ?? [];
if (sintaxe.length > 0) {
  console.log(`\n✗ ${sintaxe.length} erro(s) de sintaxe em ${SOURCE}:`);
  for (const d of sintaxe) {
    const { line } = d.file.getLineAndCharacterOfPosition(d.start);
    console.log(`  L${line + 1} ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`);
  }
  process.exit(1);
}

const js = ts.transpileModule(src, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
  },
}).outputText;

const sandbox = {
  Deno: { env: { get: () => undefined } },
  console,
  crypto,
  btoa,
  fetch: () => {},
  module: { exports: {} },
  exports: {},
};
vm.createContext(sandbox);
vm.runInContext(
  js + '\n;globalThis.__t = { selectImages, validateCards, answerLengthBias };',
  sandbox,
);
const { selectImages, validateCards, answerLengthBias } = vm.runInContext(
  '__t',
  sandbox,
);

let fail = 0;
const check = (label, cond, extra = '') => {
  console.log(`  ${cond ? '✓' : '✗'} ${label}${cond ? '' : '  ← ' + extra}`);
  if (!cond) fail++;
};

const img = (id, page, w = 300, h = 200, caption = null) => ({
  id,
  page,
  path: `img/${id}.jpg`,
  thumb_path: `thumb/${id}.jpg`,
  caption,
  kind: 'embedded',
  size: [w, h],
});

// ── Seleção de figuras ──────────────────────────────────────────────────────
console.log('\n── seleção de figuras ──');

// Caso adversário: uma página com 50 figuras grandes tentando monopolizar,
// contra 40 páginas com 1 figura pequena cada (90 no total, orçamento 60).
const catalog = [];
let id = 1;
for (let i = 0; i < 50; i++) catalog.push(img(id++, 8, 900, 900));
for (let p = 1; p <= 40; p++) if (p !== 8) catalog.push(img(id++, p, 120, 100));

const sel = selectImages(catalog);
const pages = new Set(sel.map(i => i.page)).size;
check(`respeita o teto de 60 (veio ${sel.length})`, sel.length === 60, sel.length);
check(
  `nenhuma página fica de fora — a densa não rouba a vaga das outras (${pages})`,
  pages === 40,
  pages,
);
check('enche o orçamento em vez de deixar vaga vazia', sel.length === 60);
check(
  'ordenado pelo id (ordem do documento)',
  sel.every((v, i, a) => i === 0 || a[i - 1].id < v.id),
);

// Série didática na mesma página não pode ser cortada quando há orçamento.
const serie = Array.from({ length: 5 }, (_, i) => img(100 + i, 17, 82, 151));
check(
  'série de 5 figuras na mesma página passa inteira quando cabe',
  selectImages([...serie, img(1, 3), img(2, 4)]).filter(i => i.page === 17)
    .length === 5,
);

check(
  'dentro da página, legenda vem antes de área',
  selectImages([img(1, 5, 100, 100, 'Figura 1 — palato'), img(2, 5, 900, 900)])[0]
    .id === 1,
);

// ── Validador ───────────────────────────────────────────────────────────────
console.log('\n── validador ──');
const sent = [img(1, 1), img(2, 2), img(3, 3)];
const card = o => ({
  front: 'P?',
  back: 'certa',
  page: 1,
  image_id: null,
  image_reason: null,
  quiz_options: ['a', 'b', 'c'],
  ...o,
});

let r = validateCards([card({ image_id: 999, image_reason: 'x' })], sent);
check(
  'figura inexistente vira card de texto (não descarta o conteúdo)',
  r.cards.length === 1 && r.cards[0].image_id === null,
);

check(
  'figura sem justificativa perde a figura',
  validateCards([card({ image_id: 1, image_reason: '  ' })], sent).cards[0]
    .image_id === null,
);

check(
  'alternativa igual à resposta → card descartado',
  validateCards([card({ quiz_options: ['certa', 'b', 'c'] })], sent).cards
    .length === 0,
);
check(
  'alternativa repetida → descartado',
  validateCards([card({ quiz_options: ['a', 'a', 'b'] })], sent).cards.length === 0,
);
check(
  'menos de 3 alternativas → descartado',
  validateCards([card({ quiz_options: ['a', 'b'] })], sent).cards.length === 0,
);
check(
  'frente vazia → descartado',
  validateCards([card({ front: '   ' })], sent).cards.length === 0,
);

const cinco = Array.from({ length: 5 }, (_, i) =>
  card({ front: `P${i}`, image_id: 1, image_reason: 'a seta indica' }),
);
r = validateCards(cinco, sent);
const comFig = r.cards.filter(c => c.image_id != null).length;
check(`mesma figura no máximo 2 vezes (ficaram ${comFig})`, comFig === 2, comFig);
check('os outros 3 viram card de texto, não somem', r.cards.length === 5);

r = validateCards([card({ image_id: 2, image_reason: 'mostra o forame' })], sent);
check('card bom passa intacto', r.cards.length === 1 && r.cards[0].image_id === 2);

// ── Viés de tamanho da alternativa ──────────────────────────────────────────
console.log('\n── paridade das alternativas ──');
check(
  'detecta 100% quando a correta é sempre a mais longa',
  answerLengthBias(
    Array.from({ length: 4 }, () =>
      card({
        back: 'uma definição bem completa e detalhada da resposta',
        quiz_options: ['a', 'b', 'c'],
      }),
    ),
  ).correct_is_longest_pct === 100,
);

// Empate NÃO pode contar: num quiz bem feito as opções têm tamanho parecido de
// propósito, e contar empate marcaria 100% de viés justo no caso desejado.
const equilibrado = [
  card({ back: 'Esmalte', quiz_options: ['Dentina', 'Cemento', 'Polpa'] }),
  card({ back: 'Dentina', quiz_options: ['Esmalte', 'Cemento', 'Polpa'] }),
];
check(
  `quiz equilibrado fica longe de 100% (${answerLengthBias(equilibrado).correct_is_longest_pct}%)`,
  answerLengthBias(equilibrado).correct_is_longest_pct < 60,
);

console.log(fail ? `\n${fail} FALHA(S)\n` : '\nTUDO OK\n');
process.exit(fail ? 1 : 0);
