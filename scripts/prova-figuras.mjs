// Mede a PASSADA DAS FIGURAS contra o bundle real do último job concluído.
//
// Existe porque calibrar prompt pelo app é caro e cego: cada tentativa gasta uma
// geração da cota do usuário e só devolve "veio pouca figura". Aqui a mesma
// chamada roda fora do app e imprime os números que interessam — quantos cards,
// quantos com figura, quantas figuras distintas, e se a resposta truncou.
//
// Lê os trechos DO FONTE da Edge Function (selectImages, buildFigurePrompt,
// CARD_SCHEMA); recopiá-los aqui testaria outra coisa.
//
//     node scripts/prova-figuras.mjs
import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';

const src = fs.readFileSync('supabase/functions/generate-cards-doc/index.ts', 'utf8');
const linhas = src.split('\n');
// Recorte por LINHA: o corpo tem chaves dentro de template string, e regex
// pegava o pedaço errado.
const bloco = (ini, fim) => {
  const i = linhas.findIndex(l => ini.test(l));
  for (let j = i + 1; j < linhas.length; j++) if (fim.test(linhas[j])) return linhas.slice(i, j + 1).join('\n');
  throw new Error('não achei ' + ini);
};
const trechos = [
  linhas.find(l => /^const MAX_PROMPT_IMAGES/.test(l)),
  bloco(/^function selectImages/, /^}$/),
  bloco(/^function buildFigurePrompt/, /^}$/),
  bloco(/^const CARD_SCHEMA/, /^} as const;$/),
].join('\n');
const js = ts.transpileModule(trechos + '\nglobalThis.X={selectImages,buildFigurePrompt,CARD_SCHEMA};',
  { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const ctx = { console }; vm.createContext(ctx); vm.runInContext(js, ctx);
const { selectImages, buildFigurePrompt, CARD_SCHEMA } = ctx.X;

const env = (f, k) => fs.readFileSync(f, 'utf8').split('\n')
  .map(l => l.trim().replace(/^export /, ''))
  .find(l => l.startsWith(k + '='))?.split('=').slice(1).join('=').replace(/^['"]|['"]$/g, '');
const SB = env('extractor/.env.local', 'SUPABASE_URL');
const KEY = env('extractor/.env.local', 'SUPABASE_SERVICE_ROLE_KEY');
const GEM = env('extractor/.env.local', 'GEMINI_API_KEY');
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const jobs = await (await fetch(
  `${SB}/rest/v1/import_jobs?select=id,user_id,source_name&status=eq.done&order=created_at.desc&limit=1`,
  { headers: H })).json();
const P = `${jobs[0].user_id}/${jobs[0].id}`;
console.log(`material: ${jobs[0].source_name}`);
const bundle = await (await fetch(`${SB}/storage/v1/object/imports/${P}/bundle.json`, { headers: H })).json();

const used = selectImages(bundle.catalog);
console.log(`catálogo: ${bundle.catalog.length} figuras | selecionadas: ${used.length}`);

const bytes = new Map();
for (let i = 0; i < used.length; i += 12) {
  await Promise.all(used.slice(i, i + 12).map(async (im) => {
    const r = await fetch(`${SB}/storage/v1/object/imports/${P}/${im.thumb_path}`, { headers: H });
    if (r.ok) bytes.set(im.id, Buffer.from(await r.arrayBuffer()));
  }));
}
console.log(`miniaturas: ${bytes.size}`);

const texto = bundle.pages.map(p => `--- página ${p.page} ---\n${p.text}` +
  (p.images.length ? `\n[figuras nesta página: ${p.images.join(', ')}]` : '')).join('\n\n');
const parts = [{ text: `Conteúdo do documento:\n\n${texto}` }];
for (const im of used) {
  if (!bytes.has(im.id)) continue;
  parts.push({ text: `IMAGEM #${im.id} — página ${im.page}` });
  parts.push({ inline_data: { mime_type: 'image/jpeg', data: bytes.get(im.id).toString('base64') } });
}

console.log(`\nchamando o Gemini com ${parts.filter(p => p.inline_data).length} imagens...`);
const t0 = Date.now();
const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEM}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    system_instruction: { parts: [{ text: buildFigurePrompt('pt-BR', used.length, 30) }] },
    contents: [{ role: 'user', parts }],
    generationConfig: { responseMimeType: 'application/json', responseJsonSchema: CARD_SCHEMA, maxOutputTokens: 32000 },
  }),
});
const body = await res.json();
console.log(`HTTP ${res.status} em ${((Date.now() - t0) / 1000).toFixed(0)}s`);
if (!res.ok) { console.log(JSON.stringify(body).slice(0, 400)); process.exit(1); }

const out = body.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
let cards = [];
try { cards = JSON.parse(out).cards ?? []; } catch { console.log('JSON não fechou'); }
const comFig = cards.filter(c => c.image_id != null);
console.log(`\n══ RESULTADO ══`);
console.log(`  cards: ${cards.length}   COM figura: ${comFig.length}`);
console.log(`  figuras distintas: ${new Set(comFig.map(c => c.image_id)).size} de ${used.length}`);
console.log(`  finishReason: ${body.candidates?.[0]?.finishReason}`);
console.log(`  tokens: ${JSON.stringify(body.usageMetadata)}`);
for (const c of comFig.slice(0, 4)) console.log(`\n  #${c.image_id}: ${c.front}\n     → ${c.back}`);
