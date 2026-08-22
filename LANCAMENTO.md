# Lançamento do Blink — o que falta

Checklist de duas pessoas (Gabriel + painel/site). Atualizado em 20/08/2026.

## ⛔ Decisão travando o resto

**Bundle ID / package name.** Hoje é `com.blink.app` em `app.json`. Ele é a
identidade PERMANENTE do app nas lojas: depois da primeira publicação, mudar
significa app novo — zera downloads e avaliações.

Decidido em 20/08: **esperar o domínio do site** e usar reverse-DNS
(ex.: domínio `blink.com.br` → `br.com.blink.app`). Enquanto isso, nenhum build
de produção.

> APK interno pode ser gerado à vontade — não toca em loja. Só lembre que ao
> trocar o pacote os testadores precisam desinstalar e instalar de novo.

## Bloqueia a submissão

- [ ] **Política de Privacidade + Termos de Uso.** Não existem. O App Store
      Connect e o Play Console pedem a URL no formulário — sem ela não dá nem
      para submeter. Precisa dizer que o app manda material do usuário para uma
      IA de terceiro.
- [ ] **Conta de desenvolvedor Apple** (US$ 99/ano, 24–48 h para ativar) —
      precisa de cartão.
- [ ] **Conta Google Play** (US$ 25, uma vez).
- [x] ~~Exclusão de conta dentro do app~~ — Apple 5.1.1(v). Feito em 20/08:
      Edge Function `delete-account` + `lib/api/deleteAccount.ts`, com teste de
      ponta a ponta em `scripts/test-delete-account.py`.

## Quebra com usuários reais

- [ ] **Cota da IA é global.** A chave grátis do Gemini dá ~20 requisições/dia
      para o app TODO, enquanto o plano `free` promete 300 gerações/mês por
      pessoa. Precisa de faturamento na API. **Depende de cartão.**
- [ ] **Supabase no plano free** já bateu 109% de egress com 8 usuários.
      **Depende de cartão.**
- [ ] **Extrator na nuvem.** Hoje `EXTRACTOR_URL` aponta para um túnel no Mac do
      Gabriel: quando ele dorme, toda importação de arquivo falha. Projeto
      `blink-extractor-23583` no Google Cloud Run já criado. **Depende de
      cartão** (escolher Pix exige R$ 200 de pré-pagamento; cartão não exige).
- [ ] **Modo Escrita sem correção semântica.** A Edge Function `grade-answer`
      existe no repo mas **nunca foi publicada**, e ainda está presa à Anthropic
      (`claude-haiku-4-5`, sem o interruptor `AI_PROVIDER` que as outras têm) —
      numa conta sem crédito. O app degrada certo (cai para cobertura de
      palavras-chave e oferece "minha resposta estava certa"), então não está
      quebrado, só desligado. Resolver junto com o crédito da IA.
- [x] ~~**Moderação da comunidade.**~~ Resolvido em 20/08: o `unlisted` do painel
      não removia nada porque as políticas de leitura eram `using (true)` e o
      painel ainda tinha duas políticas `published_at is not null` (sempre
      verdadeiras) somando por OU. Corrigido e testado em
      `scripts/test-moderation.py`.
- [x] ~~Avatar em base64 no banco~~ — corrigido em 20/08 (ia para
      `community_decks` e `deck_ratings`, multiplicando o egress).
- [x] ~~E-mail de suporte pessoal~~ — trocado para `blinkflashcards@gmail.com`.

## Antes de abrir para estranhos

- [ ] Trocar a senha do painel administrativo e reativar o TOTP.
- [ ] Considerar rotacionar a chave `service_role` do Supabase.

> As duas foram adiadas em 19/08 com a justificativa de que só duas pessoas
> usavam o app. Essa premissa deixa de valer no lançamento.

## Fora do escopo da v1

- **Site de compartilhamento por link** — a aba Comunidade já entrega
  compartilhamento dentro do app. Fica para a v1.1.

## Como gerar um build

```bash
npx eas-cli login          # conta Expo (grátis)
npx eas-cli init           # registra o projeto, grava o projectId em app.json
npx eas-cli build --platform android --profile preview
```

O perfil `preview` gera **APK** de distribuição interna, instalável direto pelo
link que o EAS devolve. As variáveis `EXPO_PUBLIC_*` estão em `eas.json` porque
`.env.local` é ignorado pelo git e não sobe para o servidor de build — sem elas
o app compila sem Supabase e todas as telas falham.

iOS exige conta Apple paga, inclusive para teste interno.
