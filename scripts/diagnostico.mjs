// DIAGNÓSTICO — mede cada etapa do pipeline de geração contra o bundle real.
// Somente leitura: não altera nada em produção. 2 chamadas de IA por rodada.
//
//     node scripts/diagnostico.mjs [quantidade]
import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';

const PEDIDO = Number(process.argv[2] ?? 30);
const src = fs.readFileSync('supabase/functions/generate-cards-doc/index.ts', 'utf8');
const L = src.split('\n');
const bloco = (ini, fim) => {
  const i = L.findIndex(l => ini.test(l));
  if (i < 0) throw new Error('não achei ' + ini);
  for (let j = i + 1; j < L.length; j++) if (fim.test(L[j])) return L.slice(i, j + 1).join('\n');
  throw new Error('sem fim: ' + ini);
};
const trechos = [
  L.find(l => /^const MAX_PROMPT_IMAGES/.test(l)),
  L.find(l => /^const MAX_CARDS_PER_IMAGE/.test(l)),
  L.find(l => /^const MAX_TEXT_CHARS/.test(l)),
  bloco(/^function selectImages/, /^}$/),
  bloco(/^function buildFigurePrompt/, /^}$/),
  bloco(/^function buildSystemPrompt/, /^}$/),
  bloco(/^function isImageDense/, /^}$/),
  bloco(/^function validateCards/, /^}$/),
  bloco(/^function salvageCards/, /^}$/),
  bloco(/^function maxOutputTokensFor/, /^}$/),
  bloco(/^const CARD_SCHEMA/, /^} as const;$/),
].join('\n').replace(/: ValidationResult/g, '');
const js = ts.transpileModule(trechos +
  '\nglobalThis.X={selectImages,buildFigurePrompt,buildSystemPrompt,isImageDense,validateCards,salvageCards,maxOutputTokensFor,CARD_SCHEMA,MAX_PROMPT_IMAGES,MAX_CARDS_PER_IMAGE};',
  { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const ctx = { console }; vm.createContext(ctx); vm.runInContext(js, ctx);
const X = ctx.X;

const env = (f, k) => fs.readFileSync(f, 'utf8').split('\n')
  .map(l => l.trim().replace(/^export /, ''))
  .find(l => l.startsWith(k + '='))?.split('=').slice(1).join('=').replace(/^['"]|['"]$/g, '');
const SB = env('extractor/.env.local', 'SUPABASE_URL');
const KEY = env('extractor/.env.local', 'SUPABASE_SERVICE_ROLE_KEY');
const GEM = env('extractor/.env.local', 'GEMINI_API_KEY');
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const jobs = await (await fetch(`${SB}/rest/v1/import_jobs?select=id,user_id,source_name&status=eq.done&order=created_at.desc&limit=1`, { headers: H })).json();
const P = `${jobs[0].user_id}/${jobs[0].id}`;
const bundle = await (await fetch(`${SB}/storage/v1/object/imports/${P}/bundle.json`, { headers: H })).json();

console.log(`material: ${jobs[0].source_name}   |   pedido: ${PEDIDO} cards\n`);

// ── FASE A5: catálogo vs enviadas ───────────────────────────────────────────
const used = X.selectImages(bundle.catalog);
const porPagCat = {}, porPagSel = {};
for (const c of bundle.catalog) porPagCat[c.page] = (porPagCat[c.page] ?? 0) + 1;
for (const c of used) porPagSel[c.page] = (porPagSel[c.page] ?? 0) + 1;
console.log('══ A5 · CATÁLOGO vs ENVIADAS ══');
console.log(`  catálogo: ${bundle.catalog.length}   enviadas: ${used.length}   teto MAX_PROMPT_IMAGES: ${X.MAX_PROMPT_IMAGES}`);
console.log(`  perdidas antes da IA: ${bundle.catalog.length - used.length}`);
const pgs = Object.keys(porPagCat).map(Number).sort((a, b) => a - b);
console.log('  páginas com figura descartada:',
  pgs.filter(p => (porPagSel[p] ?? 0) < porPagCat[p]).map(p => `p${p}(${porPagSel[p] ?? 0}/${porPagCat[p]})`).join(' ') || 'nenhuma');
console.log(`  IDs enviados: ${used.map(i => i.id).join(',')}\n`);

const texto = bundle.pages.map(p => `--- página ${p.page} ---\n${p.text}` +
  (p.images.length ? `\n[figuras nesta página: ${p.images.join(', ')}]` : '')).join('\n\n').slice(0, 400000);

const bytes = new Map();
for (let i = 0; i < used.length; i += 12) {
  await Promise.all(used.slice(i, i + 12).map(async (im) => {
    const r = await fetch(`${SB}/storage/v1/object/imports/${P}/${im.thumb_path}`, { headers: H });
    if (r.ok) bytes.set(im.id, Buffer.from(await r.arrayBuffer()));
  }));
}

async function gemini(system, parts, maxTok) {
  const t0 = Date.now();
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEM}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts }],
      generationConfig: { responseMimeType: 'application/json', responseJsonSchema: X.CARD_SCHEMA, maxOutputTokens: maxTok },
    }),
  });
  const b = await r.json();
  const seg = (Date.now() - t0) / 1000;
  const txt = b.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  let cards = null, viaResgate = false;
  try { cards = JSON.parse(txt).cards ?? []; }
  catch { cards = X.salvageCards(txt); viaResgate = true; }
  return { http: r.status, seg, cards, viaResgate, fin: b.candidates?.[0]?.finishReason, uso: b.usageMetadata, erro: r.ok ? null : JSON.stringify(b).slice(0, 300) };
}

// ── PASSADA 1: figuras ──────────────────────────────────────────────────────
const parts1 = [{ text: `Conteúdo do documento:\n\n${texto}` }];
for (const im of used) {
  if (!bytes.has(im.id)) continue;
  parts1.push({ text: `IMAGEM #${im.id} — página ${im.page}` });
  parts1.push({ inline_data: { mime_type: 'image/jpeg', data: bytes.get(im.id).toString('base64') } });
}
console.log('══ PASSADA 1 · FIGURAS ══');
const p1 = await gemini(X.buildFigurePrompt('pt-BR', used.length, PEDIDO), parts1, X.maxOutputTokensFor(PEDIDO));
if (p1.erro) { console.log('  ERRO', p1.http, p1.erro); process.exit(1); }
console.log(`  HTTP ${p1.http}  ${p1.seg.toFixed(0)}s  finishReason=${p1.fin}  resgate=${p1.viaResgate}`);
console.log(`  modelo devolveu: ${p1.cards.length} cards   (com image_id: ${p1.cards.filter(c => c.image_id != null).length})`);
console.log(`  tokens: entrada=${p1.uso?.promptTokenCount} saída=${p1.uso?.candidatesTokenCount} raciocínio=${p1.uso?.thoughtsTokenCount}`);
const daFigura = p1.cards.filter(c => c.image_id != null);
console.log(`  descartados pelo filtro image_id!=null do fluxo: ${p1.cards.length - daFigura.length}\n`);

// ── PASSADA 2: texto (só se faltar) ─────────────────────────────────────────
let daTexto = [];
const faltam = PEDIDO - daFigura.length;
console.log('══ PASSADA 2 · TEXTO ══');
if (faltam > 0) {
  const denso = X.isImageDense(Number(bundle.stats?.chars ?? 0), Number(bundle.stats?.pages ?? 0), bundle.catalog.length);
  const p2 = await gemini(X.buildSystemPrompt(faltam, 'pt-BR', false, denso, 0), [{ text: `Conteúdo do documento:\n\n${texto}` }], X.maxOutputTokensFor(faltam));
  console.log(`  faltavam ${faltam} | HTTP ${p2.http} ${p2.seg.toFixed(0)}s finishReason=${p2.fin} devolveu=${p2.cards.length}`);
  daTexto = p2.cards.map(c => ({ ...c, image_id: null, image_reason: null }));
  console.log(`  TEMPO TOTAL DAS DUAS PASSADAS: ${(p1.seg + p2.seg).toFixed(0)}s`);
} else {
  console.log(`  não roda: a passada 1 já entregou ${daFigura.length} de ${PEDIDO}`);
  console.log(`  TEMPO TOTAL: ${p1.seg.toFixed(0)}s`);
}

// ── VALIDADOR REAL ──────────────────────────────────────────────────────────
const cru = [...daFigura, ...daTexto].slice(0, PEDIDO);
const v = X.validateCards(cru, used);
console.log(`\n══ A2/A3 · ONDE OS CARDS SOMEM ══`);
console.log(`  solicitados          : ${PEDIDO}`);
console.log(`  modelo devolveu      : ${p1.cards.length + daTexto.length}`);
console.log(`  após filtro do fluxo : ${cru.length}`);
console.log(`  validador aceitou    : ${v.cards.length}`);
console.log(`  descartados de vez   : ${v.dropped}`);
console.log(`  motivos (inclui perda SÓ da figura, sem perder o card):`);
for (const [m, n] of Object.entries(v.reasons)) console.log(`     - ${m}: ${n}`);
if (!Object.keys(v.reasons).length) console.log('     (nenhum)');

// ── A4/A6 · figuras ─────────────────────────────────────────────────────────
const comFig = v.cards.filter(c => c.image_id != null);
const dist = {};
for (const c of comFig) dist[c.image_id] = (dist[c.image_id] ?? 0) + 1;
console.log(`\n══ A4/A6 · FIGURAS ══`);
console.log(`  cards com figura   : ${comFig.length} de ${v.cards.length}  (${Math.round(100 * comFig.length / (v.cards.length || 1))}%)`);
console.log(`  figuras distintas  : ${Object.keys(dist).length} de ${used.length} enviadas`);
console.log(`  distribuição: ${Object.entries(dist).map(([k, n]) => `#${k}→${n}`).join('  ')}`);
console.log(`\n  image_reason (primeiros 8):`);
for (const c of comFig.slice(0, 8)) console.log(`   #${c.image_id}: ${(c.image_reason || '(vazio)').slice(0, 90)}`);
const semFig = v.cards.filter(c => c.image_id == null);
console.log(`\n  cards SEM figura: ${semFig.length}`);
fs.writeFileSync('/tmp/diag.json', JSON.stringify({ cru, validados: v.cards, reasons: v.reasons }, null, 2));
console.log(`\n(saída completa em /tmp/diag.json)`);
