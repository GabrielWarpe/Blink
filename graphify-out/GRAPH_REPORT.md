# Graph Report - Blink  (2026-08-18)

## Corpus Check
- 156 files · ~499,938 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1071 nodes · 2682 edges · 82 communities (45 shown, 37 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ddd90573`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- importDocument.ts
- main.py
- achievements.ts
- SettingsContext.tsx
- backup.ts
- decks.tsx
- useThemeColors
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
- Blink App Icon (1024px)
- package.json
- useSettings
- grade-answer/index.ts
- metro.config.js
- graphify reference: extra exports and benchmark
- Badge.tsx
- expo-asset
- expo-constants
- expo-crypto
- expo-document-picker
- expo-file-system
- graphify reference: query, path, explain
- graphify reference: add a URL and watch a folder
- @expo-google-fonts/plus-jakarta-sans
- expo-haptics
- expo-image
- expo-image-manipulator
- app/_layout.tsx
- expo-blur
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
- react-native-svg
- react-native-url-polyfill
- graphify reference: incremental update and cluster-only
- tailwindcss
- graphify reference: GitHub clone and cross-repo merge
- graphify-context.sh
- expo-font
- database.ts
- @react-native-community/datetimepicker
- react-native-worklets
- graphify reference: transcribe video and audio
- CLAUDE.md
- extraction-spec.md
- settings.tsx
- pdf.py
- expo-secure-store
- storage.py
- expo
- generateCards.ts
- DeckAvatar.tsx
- progress.tsx
- pptx.py
- docx.py
- ExtractedImage
- answer.ts
- benchmark.py

## God Nodes (most connected - your core abstractions)
1. `useThemeColors()` - 125 edges
2. `useAuth()` - 47 edges
3. `useSettings()` - 36 edges
4. `expo-router` - 33 edges
5. `ExtractedImage` - 25 edges
6. `db` - 24 edges
7. `Options` - 22 edges
8. `useGlass()` - 22 edges
9. `Deck` - 22 edges
10. `Button()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `AiGeneratorForm()` --indirect_call--> `base64()`  [INFERRED]
  components/AiGeneratorForm.tsx → supabase/functions/generate-cards-doc/index.ts
- `ImportScreen()` --indirect_call--> `base64()`  [INFERRED]
  app/deck/import.tsx → supabase/functions/generate-cards-doc/index.ts
- `TabsLayout()` --calls--> `useAuth()`  [EXTRACTED]
  app/(tabs)/_layout.tsx → contexts/AuthContext.tsx
- `ThemeController()` --calls--> `useSettings()`  [EXTRACTED]
  app/_layout.tsx → contexts/SettingsContext.tsx
- `MiniAvatar()` --calls--> `useThemeColors()`  [EXTRACTED]
  app/community/[id].tsx → hooks/useThemeColors.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Pipeline de IA server-side (Claude via Edge Function)** — readme_geracao_com_ia, readme_modo_escrever, readme_edge_function, readme_claude_ia, readme_anthropic_api_key_secret [INFERRED 0.85]
- **Modelo de dados Supabase com RLS** — readme_supabase, readme_row_level_security, readme_schema_sql, readme_tabela_profiles, readme_tabela_flashcards [INFERRED 0.85]
- **Loop de estudo SM-2 e metricas** — readme_repeticao_espacada_sm2, readme_tabela_flashcards, readme_tabela_study_sessions, readme_tabela_card_reviews [INFERRED 0.75]
- **Blink Icon Visual Language** — assets_brand_blink_adaptive_foreground_flashcard_stack, assets_brand_blink_adaptive_foreground_wink_face, assets_brand_blink_adaptive_foreground_flip_arrow, assets_brand_blink_adaptive_foreground_brand_palette, assets_brand_blink_adaptive_foreground_squircle_container [INFERRED 0.85]

## Communities (82 total, 37 thin omitted)

### Community 0 - "importDocument.ts"
Cohesion: 0.12
Nodes (23): Attachment, ICON, ImportScreen(), KIND_LABEL, detectSourceFormat(), extractDocument(), ExtractedFigure, Extraction (+15 more)

### Community 1 - "main.py"
Cohesion: 0.27
Nodes (9): BaseModel, Versão reduzida para o prompt. Falhou? devolve a original., thumbnail(), _authorize(), extract_document(), ExtractRequest, health(), Serviço de extração de documentos do Blink.  Um endpoint só: recebe o ponteiro d (+1 more)

### Community 2 - "achievements.ts"
Cohesion: 0.09
Nodes (40): AchievementsScreen(), stripEmoji(), LevelsScreen(), ProgressScreen(), Emblem(), EmblemProps, GameIcon(), GameIconProps (+32 more)

### Community 3 - "SettingsContext.tsx"
Cohesion: 0.09
Nodes (26): TabsLayout(), FlashCard(), FlashCardProps, SwipeCard(), SwipeCardProps, TabBar(), TabSlotProps, IoniconName (+18 more)

### Community 4 - "backup.ts"
Cohesion: 0.10
Nodes (35): accuracyColor(), DeckDetailScreen(), Tab, DecksScreen(), useStudyModePicker(), getDueCards(), APP, applyCardImport() (+27 more)

### Community 5 - "decks.tsx"
Cohesion: 0.13
Nodes (17): DECK_SORTS, DeckSort, ConflictResolution, ImportConflictModal(), Props, LoadError(), LoadErrorProps, RevealSearchBar() (+9 more)

### Community 6 - "useThemeColors"
Cohesion: 0.05
Nodes (91): ForgotPasswordScreen(), LoginScreen(), mapAuthError(), FieldErrors, RegisterScreen(), Mode, CardEditorScreen(), Mode (+83 more)

### Community 7 - "expo"
Cohesion: 0.07
Nodes (27): backgroundColor, foregroundImage, adaptiveIcon, package, typedRoutes, expo, android, assetBundlePatterns (+19 more)

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
Nodes (17): date-fns, @expo-google-fonts/inter, expo-image-picker, expo-linear-gradient, expo-notifications, expo-splash-screen, dependencies, date-fns (+9 more)

### Community 13 - "generate-cards/index.ts"
Cohesion: 0.18
Nodes (4): ContentType, CORS_HEADERS, GenerateRequest, Mode

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
Cohesion: 0.16
Nodes (16): COMMUNITY_SORTS, CommunityScreen(), LIST_TITLE, HomeScreen(), ProfileScreen(), GoalSlider(), GoalSliderProps, Card() (+8 more)

### Community 18 - "Blink App Icon (1024px)"
Cohesion: 0.62
Nodes (7): Blink Brand Palette (Deep Navy + Teal Accent + Off-White), Flashcard Stack Motif, Card Flip Arrow Glyph, Blink App Icon (1024px), Spaced Repetition Product Identity, Squircle Launcher Geometry (1024 Master Asset), Winking Face Mark (Blink)

### Community 19 - "package.json"
Cohesion: 0.22
Nodes (8): main, name, scripts, android, ios, start, web, version

### Community 20 - "useSettings"
Cohesion: 0.13
Nodes (28): DeckOption, DeckPickerModal(), Props, EnterAnimation(), EnterAnimationProps, FilterSheet(), FilterSheetProps, SortOption (+20 more)

### Community 22 - "metro.config.js"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, { withNativeWind }

### Community 23 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 30 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 31 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 36 - "app/_layout.tsx"
Cohesion: 0.06
Nodes (38): plugins, FONT_BASE, FONT_SCALE, LEADING_BASE, NotificationController(), RootNavigator(), THEME_MAP, ThemeController() (+30 more)

### Community 40 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 48 - "Blink — serviço de extração"
Cohesion: 0.17
Nodes (11): Avisos, Blink — serviço de extração, Conferir a extração sem subir nada, Contrato, Deploy, Formatos, Limites, O filtro (+3 more)

### Community 51 - "generate-cards-doc/index.ts"
Cohesion: 0.11
Nodes (27): answerLengthBias(), base64(), buildExtraction(), buildSystemPrompt(), buildUserBlocks(), Bundle, callModel(), CARD_SCHEMA (+19 more)

### Community 55 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 63 - "database.ts"
Cohesion: 0.06
Nodes (68): AuthorReply(), CommunityDeckScreen(), Metric(), MiniAvatar(), PublishDeckScreen(), CreateDeckScreen(), EditDeckScreen(), DeckCardProps (+60 more)

### Community 69 - "settings.tsx"
Cohesion: 0.18
Nodes (14): SettingsScreen(), SettingsRow(), SettingsRowProps, dateToHm(), hmToDate(), TimePickerRow(), TimePickerRowProps, Toggle() (+6 more)

### Community 70 - "pdf.py"
Cohesion: 0.13
Nodes (24): Document, digest(), normalize(), Converte para JPEG RGB com teto de lado. None se não for imagem legível., extract_pdf(), _find_caption(), _first_rect(), _looks_vectorial() (+16 more)

### Community 72 - "storage.py"
Cohesion: 0.33
Nodes (10): Client, download(), _headers(), Cliente mínimo do Supabase Storage.  A API REST do Storage é simples o bastante, Sobe um objeto. Passe `client` para reaproveitar a conexão em lote., Sobe vários objetos em paralelo, reaproveitando conexões.      Existe porque um, StorageError, upload() (+2 more)

### Community 74 - "generateCards.ts"
Cohesion: 0.20
Nodes (9): generateCards(), GenerateContentType, GeneratedFlashcard, GeneratedQuizQuestion, GenerateErrorCode, GenerateMode, GenerateParams, GenerateResult (+1 more)

### Community 75 - "DeckAvatar.tsx"
Cohesion: 0.40
Nodes (4): DeckAvatar(), DeckAvatarProps, DeckMiniCard(), DeckMiniCardProps

### Community 78 - "progress.tsx"
Cohesion: 0.15
Nodes (16): StatCard(), ActivityHeatmap(), ActivityHeatmapProps, alphaHex(), levelFor(), SettingsSection(), SettingsSectionProps, StreakBadge() (+8 more)

### Community 79 - "pptx.py"
Cohesion: 0.21
Nodes (17): parse_xml(), Mapa `rId` → caminho do alvo dentro do ZIP, para o `.rels` de uma parte.     É o, relationships(), extract_pptx(), _notes_text(), Bundle, Element, ZipFile (+9 more)

### Community 80 - "docx.py"
Cohesion: 0.29
Nodes (9): extract_docx(), Bundle, Element, ZipFile, DOCX — Word.  Mais simples que o PDF pelo mesmo motivo do PPTX: as figuras já es, Texto na ordem do documento; tabelas à parte, em markdown., _read_body(), _table_markdown() (+1 more)

### Community 81 - "ExtractedImage"
Cohesion: 0.12
Nodes (13): Any, ExtractedImage, Figura encontrada no documento, já normalizada e pronta para subir., apply_filter(), _cap_candidates(), is_flat(), postprocess(), Bundle (+5 more)

### Community 82 - "answer.ts"
Cohesion: 0.39
Nodes (8): AnswerCheck, AnswerVerdict, checkAnswer(), keywords(), levenshtein(), normalizeAnswer(), present(), STOPWORDS

### Community 84 - "benchmark.py"
Cohesion: 0.18
Nodes (17): build_system_prompt(), call_anthropic(), call_gemini(), main(), Model, post(), Rodízio por página até encher o orçamento — igual à Edge Function., Acha o arquivo da figura no disco.      O `path` do bundle (`img/0007.jpg`) é o (+9 more)

## Ambiguous Edges - Review These
- `Blink Product Identity` → `Spaced Repetition Card Review Loop`  [AMBIGUOUS]
  assets/brand/blink_adaptive_foreground.png · relation: conceptually_related_to

## Knowledge Gaps
- **264 isolated node(s):** `Mode`, `Mode`, `Attachment`, `ATTACHMENT_ICON`, `AiGeneratorFormProps` (+259 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Blink Product Identity` and `Spaced Repetition Card Review Loop`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `useThemeColors()` connect `useThemeColors` to `importDocument.ts`, `achievements.ts`, `SettingsContext.tsx`, `backup.ts`, `app/_layout.tsx`, `settings.tsx`, `decks.tsx`, `DeckAvatar.tsx`, `progress.tsx`, `community.tsx`, `useSettings`, `database.ts`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `expo-router` connect `community.tsx` to `importDocument.ts`, `achievements.ts`, `SettingsContext.tsx`, `backup.ts`, `app/_layout.tsx`, `useThemeColors`, `settings.tsx`, `decks.tsx`, `progress.tsx`, `useSettings`, `database.ts`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `base64()` connect `generate-cards-doc/index.ts` to `importDocument.ts`, `useThemeColors`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `Mode`, `Mode`, `Attachment` to the rest of the system?**
  _264 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `importDocument.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11965811965811966 - nodes in this community are weakly interconnected._
- **Should `achievements.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08780841799709724 - nodes in this community are weakly interconnected._