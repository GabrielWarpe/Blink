# Graph Report - Blink  (2026-08-22)

## Corpus Check
- 164 files · ~134,049 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1168 nodes · 2810 edges · 94 communities (54 shown, 40 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.64)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c31f9d56`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- progress.tsx
- main.py
- profile.tsx
- study/[deckId].tsx
- backup.ts
- test-generate-cards.js
- AiGeneratorForm.tsx
- expo
- Blink (flashcards app)
- devDependencies
- include
- Options
- dependencies
- generate-cards/index.ts
- Blink Adaptive Icon Foreground
- ooxml.py
- What You Must Do When Invoked
- community.tsx
- AuthContext.tsx
- database.ts
- GlassSurface.tsx
- grade-answer/index.ts
- metro.config.js
- graphify reference: extra exports and benchmark
- Badge.tsx
- diagnostico.mjs
- expo-constants
- package.json
- expo-document-picker
- expo-file-system
- graphify reference: query, path, explain
- graphify reference: add a URL and watch a folder
- @expo-google-fonts/plus-jakarta-sans
- expo-haptics
- expo-image
- expo-image-manipulator
- Lançamento do Blink — o que falta
- test-moderation.py
- expo-linking
- expo-router
- graphify reference: commit hook and native CLAUDE.md integration
- expo-sharing
- @react-native-async-storage/async-storage
- expo-status-bar
- @expo/vector-icons
- nativewind
- react
- react-native
- Blink — serviço de extração
- react-native-gesture-handler
- react-native-reanimated
- generate-cards-doc/index.ts
- react-native-screens
- test-delete-account.py
- react-native-url-polyfill
- graphify reference: incremental update and cluster-only
- tailwindcss
- graphify reference: GitHub clone and cross-repo merge
- graphify-context.sh
- useThemeColors
- create.tsx
- @react-native-community/datetimepicker
- react-native-worklets
- graphify reference: transcribe video and audio
- CLAUDE.md
- extraction-spec.md
- TabBar.tsx
- pdf.py
- expo-secure-store
- types/index.ts
- expo-blur
- expo
- expo-font
- app/_layout.tsx
- prova-figuras.mjs
- settings.tsx
- pptx.py
- docx.py
- ExtractedImage
- write/[deckId].tsx
- decks.tsx
- benchmark.py
- useSettings
- date-fns
- delete-account/index.ts
- react-native-svg
- SettingsContext.tsx
- notifications.ts
- ActivityHeatmap.tsx
- CardImages.tsx
- expo-asset

## God Nodes (most connected - your core abstractions)
1. `useThemeColors()` - 128 edges
2. `useAuth()` - 50 edges
3. `useSettings()` - 36 edges
4. `expo-router` - 33 edges
5. `ExtractedImage` - 25 edges
6. `Options` - 24 edges
7. `db` - 24 edges
8. `Deck` - 22 edges
9. `Button()` - 20 edges
10. `Bundle` - 20 edges

## Surprising Connections (you probably didn't know these)
- `useStudyTimer()` --indirect_call--> `check()`  [INFERRED]
  hooks/useStudyTimer.ts → scripts/test-generate-cards.js
- `TabsLayout()` --calls--> `useAuth()`  [EXTRACTED]
  app/(tabs)/_layout.tsx → contexts/AuthContext.tsx
- `ThemeController()` --calls--> `useSettings()`  [EXTRACTED]
  app/_layout.tsx → contexts/SettingsContext.tsx
- `MiniAvatar()` --calls--> `useThemeColors()`  [EXTRACTED]
  app/community/[id].tsx → hooks/useThemeColors.ts
- `AuthorReply()` --calls--> `useThemeColors()`  [EXTRACTED]
  app/community/[id].tsx → hooks/useThemeColors.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Pipeline de IA server-side (Claude via Edge Function)** — readme_geracao_com_ia, readme_modo_escrever, readme_edge_function, readme_claude_ia, readme_anthropic_api_key_secret [INFERRED 0.85]
- **Modelo de dados Supabase com RLS** — readme_supabase, readme_row_level_security, readme_schema_sql, readme_tabela_profiles, readme_tabela_flashcards [INFERRED 0.85]
- **Loop de estudo SM-2 e metricas** — readme_repeticao_espacada_sm2, readme_tabela_flashcards, readme_tabela_study_sessions, readme_tabela_card_reviews [INFERRED 0.75]
- **Blink Icon Visual Language** — assets_brand_blink_adaptive_foreground_flashcard_stack, assets_brand_blink_adaptive_foreground_wink_face, assets_brand_blink_adaptive_foreground_flip_arrow, assets_brand_blink_adaptive_foreground_brand_palette, assets_brand_blink_adaptive_foreground_squircle_container [INFERRED 0.85]

## Communities (94 total, 40 thin omitted)

### Community 0 - "progress.tsx"
Cohesion: 0.15
Nodes (16): Tab, ProgressScreen(), DeckAvatar(), DeckAvatarProps, DeckCard(), DeckCardProps, StreakBadge(), StreakBadgeProps (+8 more)

### Community 1 - "main.py"
Cohesion: 0.27
Nodes (9): BaseModel, Versão reduzida para o prompt. Falhou? devolve a original., thumbnail(), _authorize(), extract_document(), ExtractRequest, health(), Serviço de extração de documentos do Blink.  Um endpoint só: recebe o ponteiro d (+1 more)

### Community 2 - "profile.tsx"
Cohesion: 0.07
Nodes (48): AchievementsScreen(), stripEmoji(), LevelsScreen(), ProfileScreen(), StatCard(), Emblem(), EmblemProps, GoalSlider() (+40 more)

### Community 3 - "study/[deckId].tsx"
Cohesion: 0.17
Nodes (22): QuizScreen(), StudySessionScreen(), FinishPromptModal(), QuizQuestion(), SessionResult(), SessionResultProps, shortTime(), SessionTimer() (+14 more)

### Community 4 - "backup.ts"
Cohesion: 0.12
Nodes (31): accuracyColor(), DeckDetailScreen(), DecksScreen(), APP, applyCardImport(), applyDeckImport(), BackupResult, buildImportPlan() (+23 more)

### Community 5 - "test-generate-cards.js"
Cohesion: 0.11
Nodes (16): catalog, check(), cinco, equilibrado, fs, path, r, sandbox (+8 more)

### Community 6 - "AiGeneratorForm.tsx"
Cohesion: 0.11
Nodes (29): Attachment, ICON, ImportScreen(), KIND_LABEL, AiGeneratorForm(), Attachment, ATTACHMENT_ICON, DOCUMENT_PIPELINE (+21 more)

### Community 7 - "expo"
Cohesion: 0.05
Nodes (40): backgroundColor, foregroundImage, adaptiveIcon, package, typedRoutes, expo, android, assetBundlePatterns (+32 more)

### Community 8 - "Blink (flashcards app)"
Cohesion: 0.11
Nodes (25): graphify knowledge graph workflow, ANTHROPIC_API_KEY como segredo de servidor, Blink (flashcards app), Bucket card-images (Storage), Claude (LLM), Comunidade (decks snapshot), Supabase Edge Function (Claude server-side), Expo / React Native stack (+17 more)

### Community 9 - "devDependencies"
Cohesion: 0.22
Nodes (9): @babel/core, @expo/ngrok, devDependencies, @babel/core, @expo/ngrok, @types/react, typescript, @types/react (+1 more)

### Community 10 - "include"
Cohesion: 0.11
Nodes (17): expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.d.ts, .expo/types/**/*.ts, nativewind-env.d.ts, node_modules, supabase/functions, **/*.ts (+9 more)

### Community 11 - "Options"
Cohesion: 0.09
Nodes (27): Exception, Bundle, Extractor, Options, Contrato comum a todos os formatos.  A regra que sustenta o roteador: seja PDF,, Resultado completo: o JSON que a IA vai consumir + os bytes a subir., Registra um aviso uma única vez., Um formato de arquivo. Toda implementação devolve o MESMO `Bundle`, e é a     ún (+19 more)

### Community 12 - "dependencies"
Cohesion: 0.12
Nodes (17): expo-crypto, @expo-google-fonts/inter, expo-image-picker, expo-linear-gradient, expo-notifications, expo-splash-screen, dependencies, expo-crypto (+9 more)

### Community 13 - "generate-cards/index.ts"
Cohesion: 0.17
Nodes (7): callGemini(), ContentType, CORS_HEADERS, GEMINI_MODELS, GenerateRequest, json(), Mode

### Community 14 - "Blink Adaptive Icon Foreground"
Cohesion: 0.36
Nodes (9): Android Adaptive Icon Foreground Layer, Blink Product Identity, Blink Brand Palette (Navy / Teal / Off-White), Flashcard Stack Motif, Curved Flip Arrow, Blink Adaptive Icon Foreground, Spaced Repetition Card Review Loop, Squircle App Container Shape (+1 more)

### Community 15 - "ooxml.py"
Cohesion: 0.12
Nodes (19): Figuras na ordem em que aparecem no documento, e depois as que estão no     paco, _read_images(), _BytesReader, is_media(), media_members(), natural_key(), open_zip(), Element (+11 more)

### Community 16 - "What You Must Do When Invoked"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 17 - "community.tsx"
Cohesion: 0.17
Nodes (16): COMMUNITY_SORTS, CommunityScreen(), LIST_TITLE, HomeScreen(), EnterAnimation(), EnterAnimationProps, useRevealSearch(), useStudyModePicker() (+8 more)

### Community 18 - "AuthContext.tsx"
Cohesion: 0.11
Nodes (17): AuthContext, AuthProvider(), parseRecoveryLink(), DeleteAccountResult, GenerateContentType, GeneratedFlashcard, GeneratedQuizQuestion, GenerateErrorCode (+9 more)

### Community 19 - "database.ts"
Cohesion: 0.08
Nodes (55): AuthorReply(), CommunityDeckScreen(), Metric(), MiniAvatar(), PublishDeckScreen(), EditDeckScreen(), PublishToggle(), PublishToggleProps (+47 more)

### Community 20 - "GlassSurface.tsx"
Cohesion: 0.12
Nodes (26): DeckOption, DeckPickerModal(), Props, FilterSheet(), FilterSheetProps, SortOption, Props, ModeOption (+18 more)

### Community 22 - "metro.config.js"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, { withNativeWind }

### Community 23 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 25 - "diagnostico.mjs"
Cohesion: 0.07
Nodes (26): bloco(), bundle, bytes, comFig, cru, ctx, daFigura, daTexto (+18 more)

### Community 27 - "package.json"
Cohesion: 0.22
Nodes (8): main, name, scripts, android, ios, start, web, version

### Community 30 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 31 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 36 - "Lançamento do Blink — o que falta"
Cohesion: 0.25
Nodes (7): Antes de abrir para estranhos, Bloqueia a submissão, Como gerar um build, ⛔ Decisão travando o resto, Fora do escopo da v1, Lançamento do Blink — o que falta, Quebra com usuários reais

### Community 37 - "test-moderation.py"
Cohesion: 0.40
Nodes (3): novo_usuario(), Teste da moderação: o `unlisted` do painel administrativo REALMENTE tira o deck, req()

### Community 40 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 48 - "Blink — serviço de extração"
Cohesion: 0.17
Nodes (11): Avisos, Blink — serviço de extração, Conferir a extração sem subir nada, Contrato, Deploy, Formatos, Limites, O filtro (+3 more)

### Community 51 - "generate-cards-doc/index.ts"
Cohesion: 0.10
Nodes (33): answerLengthBias(), base64(), buildExtraction(), buildFigurePrompt(), buildSystemPrompt(), buildUserBlocks(), Bundle, callAnthropic() (+25 more)

### Community 55 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 62 - "useThemeColors"
Cohesion: 0.16
Nodes (18): ForgotPasswordScreen(), LoginScreen(), mapAuthError(), FieldErrors, RegisterScreen(), ResetPasswordScreen(), ProgressRing(), ProgressRingProps (+10 more)

### Community 63 - "create.tsx"
Cohesion: 0.19
Nodes (22): AddCardsScreen(), Mode, CardEditorScreen(), CreateDeckScreen(), Mode, CardImagePicker(), CardImagePickerProps, DeckCoverPicker() (+14 more)

### Community 69 - "TabBar.tsx"
Cohesion: 0.19
Nodes (10): TabsLayout(), TabBar(), TabSlotProps, IoniconName, TabBarIcon(), TabBarIconProps, TabIconName, TabBarCollapseContext (+2 more)

### Community 70 - "pdf.py"
Cohesion: 0.13
Nodes (24): Document, digest(), normalize(), Converte para JPEG RGB com teto de lado. None se não for imagem legível., extract_pdf(), _find_caption(), _first_rect(), _looks_vectorial() (+16 more)

### Community 72 - "types/index.ts"
Cohesion: 0.16
Nodes (14): image, DeckMiniCard(), DeckMiniCardProps, StudyModePickerProps, useActiveTimer(), CardAnswer, Maturity, reviewCard() (+6 more)

### Community 76 - "app/_layout.tsx"
Cohesion: 0.08
Nodes (23): FONT_BASE, FONT_SCALE, LEADING_BASE, NotificationController(), RootNavigator(), THEME_MAP, ThemeController(), ThemeVarsView() (+15 more)

### Community 77 - "prova-figuras.mjs"
Cohesion: 0.10
Nodes (17): bundle, bytes, cards, comFig, ctx, GEM, H, jobs (+9 more)

### Community 78 - "settings.tsx"
Cohesion: 0.21
Nodes (14): SettingsScreen(), SessionTimerProps, StudySetupProps, clampGoal(), clampTimerLimit(), TIMER_LIMIT_STEPS, StudyTimerPhase, useStudyTimer() (+6 more)

### Community 79 - "pptx.py"
Cohesion: 0.21
Nodes (17): parse_xml(), Mapa `rId` → caminho do alvo dentro do ZIP, para o `.rels` de uma parte.     É o, relationships(), extract_pptx(), _notes_text(), Bundle, Element, ZipFile (+9 more)

### Community 80 - "docx.py"
Cohesion: 0.29
Nodes (9): extract_docx(), Bundle, Element, ZipFile, DOCX — Word.  Mais simples que o PDF pelo mesmo motivo do PPTX: as figuras já es, Texto na ordem do documento; tabelas à parte, em markdown., _read_body(), _table_markdown() (+1 more)

### Community 81 - "ExtractedImage"
Cohesion: 0.12
Nodes (13): Any, ExtractedImage, Figura encontrada no documento, já normalizada e pronta para subir., apply_filter(), _cap_candidates(), is_flat(), postprocess(), Bundle (+5 more)

### Community 82 - "write/[deckId].tsx"
Cohesion: 0.22
Nodes (13): shuffle(), WriteScreen(), MODES, StudySetup(), cardShadow, AnswerCheck, AnswerVerdict, checkAnswer() (+5 more)

### Community 83 - "decks.tsx"
Cohesion: 0.14
Nodes (15): DECK_SORTS, DeckSort, ConflictResolution, ImportConflictModal(), Props, LoadError(), LoadErrorProps, RevealSearchBar() (+7 more)

### Community 84 - "benchmark.py"
Cohesion: 0.11
Nodes (27): Client, build_system_prompt(), call_anthropic(), call_gemini(), main(), Model, post(), Rodízio por página até encher o orçamento — igual à Edge Function. (+19 more)

### Community 85 - "useSettings"
Cohesion: 0.35
Nodes (9): AiGeneratorFormProps, FlashCard(), FlashCardProps, QuizQuestionProps, SwipeCard(), SwipeCardProps, useSettings(), useCardSize() (+1 more)

### Community 89 - "SettingsContext.tsx"
Cohesion: 0.26
Nodes (11): AppSettings, DEFAULTS, hasLegacyKeys(), LEGACY_KEYS, migrateLegacy(), parseSettings(), pushSettings(), SettingsContext (+3 more)

### Community 90 - "notifications.ts"
Cohesion: 0.30
Nodes (11): checkAchievements(), androidChannel(), dateAt(), dueCountAt(), ensureAndroidChannel(), fireNotification(), fireStreakNotification(), parseTime() (+3 more)

### Community 91 - "ActivityHeatmap.tsx"
Cohesion: 0.60
Nodes (4): ActivityHeatmap(), ActivityHeatmapProps, alphaHex(), levelFor()

## Ambiguous Edges - Review These
- `Blink Product Identity` → `Spaced Repetition Card Review Loop`  [AMBIGUOUS]
  assets/brand/blink_adaptive_foreground.png · relation: conceptually_related_to

## Knowledge Gaps
- **327 isolated node(s):** `graphify-context.sh script`, `name`, `slug`, `version`, `orientation` (+322 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Blink Product Identity` and `Spaced Repetition Card Review Loop`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `useThemeColors()` connect `useThemeColors` to `progress.tsx`, `profile.tsx`, `study/[deckId].tsx`, `backup.ts`, `AiGeneratorForm.tsx`, `expo`, `community.tsx`, `AuthContext.tsx`, `database.ts`, `GlassSurface.tsx`, `create.tsx`, `TabBar.tsx`, `app/_layout.tsx`, `settings.tsx`, `write/[deckId].tsx`, `decks.tsx`, `useSettings`, `ActivityHeatmap.tsx`, `CardImages.tsx`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Why does `expo-router` connect `community.tsx` to `progress.tsx`, `profile.tsx`, `study/[deckId].tsx`, `TabBar.tsx`, `AiGeneratorForm.tsx`, `expo`, `app/_layout.tsx`, `settings.tsx`, `AuthContext.tsx`, `database.ts`, `decks.tsx`, `write/[deckId].tsx`, `GlassSurface.tsx`, `useThemeColors`, `create.tsx`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `base64()` connect `generate-cards-doc/index.ts` to `AiGeneratorForm.tsx`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `graphify-context.sh script`, `name`, `slug` to the rest of the system?**
  _327 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `profile.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `backup.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11693548387096774 - nodes in this community are weakly interconnected._