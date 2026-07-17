# Blink 📚

App mobile de flashcards com **repetição espaçada** (algoritmo SM-2, estilo Anki), construído com Expo / React Native e Supabase. Crie decks manualmente ou com IA, estude no ritmo certo e acompanhe seu progresso — tudo sincronizado na sua conta.

## Funcionalidades

- **Decks e flashcards** — crie, edite e organize decks com emoji, cor, capa, tags e imagens nos cards
- **Geração com IA** — gere cards automaticamente a partir de um tópico, texto, imagem ou PDF (Claude)
- **Repetição espaçada (SM-2)** — cada card é reagendado conforme sua avaliação: *De novo*, *Difícil*, *Bom* ou *Fácil* (com gestos de swipe)
- **Modos de prática** — flashcards clássicos, **Quiz** de alternativas e modo **Escrever** (digite a resposta)
- **Progresso e hábito** — meta diária, sequência (streak), heatmap de atividade, XP/níveis e 20 conquistas
- **Lembretes inteligentes** — notificações locais com base nos cards devidos dos próximos dias
- **Personalização** — tema claro/escuro/sistema, cor de destaque, tamanho de fonte, redução de movimento
- **Tudo na conta** — decks, sessões, conquistas, configurações e onboarding sincronizados via Supabase (multi-aparelho)

## Stack

| Camada | Tecnologia |
| --- | --- |
| App | Expo 54 · React Native 0.81 · React 19 · TypeScript |
| Navegação | expo-router (rotas por arquivo) |
| Estilo | NativeWind 4 (Tailwind) + tokens de tema próprios |
| Animações | react-native-reanimated 4 |
| Backend | Supabase (Auth, Postgres com RLS, Storage) |
| Imagens | expo-image (cache memória+disco, prefetch nas sessões) |
| IA | API da Anthropic (Claude) para gerar flashcards |

## Como rodar

### 1. Pré-requisitos

- Node.js LTS e npm
- App **Expo Go** no celular (ou emulador Android/iOS)
- Um projeto no [Supabase](https://supabase.com) (grátis)

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar o Supabase

1. Crie um projeto no Supabase
2. Abra o **SQL Editor** e execute o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) — o script é idempotente (pode rodar de novo após atualizações do schema)
3. Copie a URL e a chave anônima em **Project Settings → API**

### 4. Variáveis de ambiente

Copie o exemplo e preencha com as credenciais do seu projeto:

```bash
cp .env.example .env.local
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
```

Para a geração de cards com IA (opcional), defina também `EXPO_PUBLIC_ANTHROPIC_API_KEY`.

> O `.env.local` está no `.gitignore` — nunca commite credenciais.

### 5. Iniciar

```bash
npx expo start          # celular no mesmo Wi-Fi (LAN)
npx expo start --tunnel # celular em outra rede
```

Escaneie o QR code com o Expo Go. Após mudar variáveis de ambiente ou instalar pacotes, reinicie com `npx expo start -c` (limpa o cache do bundler).

## Estrutura do projeto

```
app/                  Rotas (expo-router)
  (auth)/             Login, registro, recuperar senha
  (tabs)/             Home, decks, progresso, perfil
  deck/               Criar/editar deck, adicionar/editar cards
  study/[deckId]      Sessão de estudo (SM-2, swipe)
  quiz/[deckId]       Modo quiz (alternativas)
  write/[deckId]      Modo escrever (resposta digitada)
  onboarding.tsx      Tutorial pós-registro (cards com virada 3D)
  settings.tsx        Configurações · achievements.tsx  Conquistas
components/           UI reutilizável (Card, Button, FlashCard, SwipeCard…)
contexts/             Auth, Settings e Onboarding (estado global)
hooks/                useDecks, useStudySession, useStreak, useThemeColors
services/             supabase, database (CRUD), ai, images, notifications,
                      achievements, backup
utils/                SM-2/agendamento, streak, XP, stats, correção de respostas
constants/            Paleta de tema, cores de destaque, parâmetros de estudo
types/                Modelos do app (Deck, Flashcard) e rows do banco
supabase/schema.sql   Schema completo (tabelas, RLS, trigger, storage)
```

## Banco de dados

Tabelas principais (todas com **Row Level Security** — cada usuário só acessa os próprios dados):

- `profiles` — nome, avatar, meta diária, streak, configurações (JSON) e flag de onboarding; criado automaticamente no registro via trigger
- `playlists` — os decks (nome, emoji, cor, capa, tags)
- `flashcards` — frente/verso, imagens e os campos do SM-2 (`interval`, `ease_factor`, `repetitions`, `next_review_date`)
- `study_sessions` — histórico de sessões (acertos, difíceis, "de novo")
- `card_reviews` — log de cada avaliação individual (base para métricas de retenção)
- `user_achievements` — conquistas desbloqueadas por conta

Imagens dos cards vivem no bucket `card-images` do Supabase Storage (leitura pública, escrita apenas na pasta do próprio usuário; nome do arquivo é o hash do conteúdo, evitando duplicatas).

## Notas de desenvolvimento

- **Notificações**: o Expo Go tem suporte limitado a notificações desde o SDK 53 — para testá-las por completo, use um [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- **Verificação de tipos**: `npx tsc --noEmit`
- O onboarding aparece uma única vez por conta, logo após o registro (`profiles.onboarding_done` + detecção de login recente no `AuthContext`)
