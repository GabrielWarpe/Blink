# Graph Report - Blink  (2026-08-18)

## Corpus Check
- 156 files · ~500,846 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1071 nodes · 2708 edges · 78 communities (41 shown, 37 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `70eeb8a0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AiGeneratorForm.tsx
- main.py
- achievements.ts
- SettingsContext.tsx
- decks.tsx
- index.tsx
- useThemeColors
- expo
- Blink (flashcards app)
- package.json
- include
- Options
- dependencies
- generate-cards/index.ts
- Blink Adaptive Icon Foreground
- ooxml.py
- What You Must Do When Invoked
- community.tsx
- Blink App Icon (1024px)
- ActivityHeatmap.tsx
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
- date-fns
- pdf.py
- expo-secure-store
- progress.tsx
- pptx.py
- docx.py
- ExtractedImage
- answer.ts
- benchmark.py

## God Nodes (most connected - your core abstractions)
1. `useThemeColors()` - 128 edges
2. `useAuth()` - 50 edges
3. `useSettings()` - 36 edges
4. `expo-router` - 33 edges
5. `ExtractedImage` - 25 edges
6. `db` - 24 edges
7. `Options` - 22 edges
8. `useGlass()` - 22 edges
9. `Deck` - 22 edges
10. `Button()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `TabsLayout()` --calls--> `useAuth()`  [EXTRACTED]
  app/(tabs)/_layout.tsx → contexts/AuthContext.tsx
- `ThemeController()` --calls--> `useSettings()`  [EXTRACTED]
  app/_layout.tsx → contexts/SettingsContext.tsx
- `MiniAvatar()` --calls--> `useThemeColors()`  [EXTRACTED]
  app/community/[id].tsx → hooks/useThemeColors.ts
- `AuthorReply()` --calls--> `useThemeColors()`  [EXTRACTED]
  app/community/[id].tsx → hooks/useThemeColors.ts
- `Metric()` --calls--> `useThemeColors()`  [EXTRACTED]
  app/community/[id].tsx → hooks/useThemeColors.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Pipeline de IA server-side (Claude via Edge Function)** — readme_geracao_com_ia, readme_modo_escrever, readme_edge_function, readme_claude_ia, readme_anthropic_api_key_secret [INFERRED 0.85]
- **Modelo de dados Supabase com RLS** — readme_supabase, readme_row_level_security, readme_schema_sql, readme_tabela_profiles, readme_tabela_flashcards [INFERRED 0.85]
- **Loop de estudo SM-2 e metricas** — readme_repeticao_espacada_sm2, readme_tabela_flashcards, readme_tabela_study_sessions, readme_tabela_card_reviews [INFERRED 0.75]
- **Blink Icon Visual Language** — assets_brand_blink_adaptive_foreground_flashcard_stack, assets_brand_blink_adaptive_foreground_wink_face, assets_brand_blink_adaptive_foreground_flip_arrow, assets_brand_blink_adaptive_foreground_brand_palette, assets_brand_blink_adaptive_foreground_squircle_container [INFERRED 0.85]

## Communities (78 total, 37 thin omitted)

### Community 0 - "AiGeneratorForm.tsx"
Cohesion: 0.08
Nodes (38): Attachment, ICON, ImportScreen(), KIND_LABEL, AiGeneratorForm(), Attachment, ATTACHMENT_ICON, DOCUMENT_PIPELINE (+30 more)

### Community 1 - "main.py"
Cohesion: 0.27
Nodes (9): BaseModel, Versão reduzida para o prompt. Falhou? devolve a original., thumbnail(), _authorize(), extract_document(), ExtractRequest, health(), Serviço de extração de documentos do Blink.  Um endpoint só: recebe o ponteiro d (+1 more)

### Community 2 - "achievements.ts"
Cohesion: 0.09
Nodes (38): AchievementsScreen(), stripEmoji(), LevelsScreen(), Emblem(), EmblemProps, GameIcon(), GameIconProps, GAME_ICON_PATHS (+30 more)

### Community 3 - "SettingsContext.tsx"
Cohesion: 0.06
Nodes (43): SettingsScreen(), TabsLayout(), AiGeneratorFormProps, FlashCard(), FlashCardProps, QuizQuestionProps, dateToHm(), hmToDate() (+35 more)

### Community 4 - "decks.tsx"
Cohesion: 0.09
Nodes (37): DECK_SORTS, DeckSort, DecksScreen(), ConflictResolution, ImportConflictModal(), Props, SPRING, useTabBarScroll() (+29 more)

### Community 5 - "index.tsx"
Cohesion: 0.36
Nodes (6): HomeScreen(), StreakBadge(), StreakBadgeProps, useStudyModePicker(), useReplayOnFocus(), getNewCards()

### Community 6 - "useThemeColors"
Cohesion: 0.06
Nodes (77): ForgotPasswordScreen(), LoginScreen(), mapAuthError(), FieldErrors, RegisterScreen(), AddCardsScreen(), Mode, CardEditorScreen() (+69 more)

### Community 7 - "expo"
Cohesion: 0.06
Nodes (33): backgroundColor, foregroundImage, adaptiveIcon, package, typedRoutes, expo, android, assetBundlePatterns (+25 more)

### Community 8 - "Blink (flashcards app)"
Cohesion: 0.11
Nodes (25): graphify knowledge graph workflow, ANTHROPIC_API_KEY como segredo de servidor, Blink (flashcards app), Bucket card-images (Storage), Claude (LLM), Comunidade (decks snapshot), Supabase Edge Function (Claude server-side), Expo / React Native stack (+17 more)

### Community 9 - "package.json"
Cohesion: 0.11
Nodes (17): @babel/core, @expo/ngrok, devDependencies, @babel/core, @expo/ngrok, @types/react, typescript, main (+9 more)

### Community 10 - "include"
Cohesion: 0.11
Nodes (17): expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.d.ts, .expo/types/**/*.ts, nativewind-env.d.ts, node_modules, supabase/functions, **/*.ts (+9 more)

### Community 11 - "Options"
Cohesion: 0.09
Nodes (27): Exception, Bundle, Extractor, Options, Contrato comum a todos os formatos.  A regra que sustenta o roteador: seja PDF,, Resultado completo: o JSON que a IA vai consumir + os bytes a subir., Registra um aviso uma única vez., Um formato de arquivo. Toda implementação devolve o MESMO `Bundle`, e é a     ún (+19 more)

### Community 12 - "dependencies"
Cohesion: 0.12
Nodes (17): expo, @expo-google-fonts/inter, expo-image-picker, expo-linear-gradient, expo-notifications, expo-splash-screen, dependencies, expo (+9 more)

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
Cohesion: 0.10
Nodes (25): COMMUNITY_SORTS, CommunityScreen(), LIST_TITLE, ProfileScreen(), StatCard(), DeckCard(), GoalSlider(), GoalSliderProps (+17 more)

### Community 18 - "Blink App Icon (1024px)"
Cohesion: 0.62
Nodes (7): Blink Brand Palette (Deep Navy + Teal Accent + Off-White), Flashcard Stack Motif, Card Flip Arrow Glyph, Blink App Icon (1024px), Spaced Repetition Product Identity, Squircle Launcher Geometry (1024 Master Asset), Winking Face Mark (Blink)

### Community 19 - "ActivityHeatmap.tsx"
Cohesion: 0.60
Nodes (4): ActivityHeatmap(), ActivityHeatmapProps, alphaHex(), levelFor()

### Community 20 - "useSettings"
Cohesion: 0.12
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
Cohesion: 0.08
Nodes (22): FONT_BASE, FONT_SCALE, LEADING_BASE, RootNavigator(), THEME_MAP, ThemeController(), ThemeVarsView(), OnboardingScreen() (+14 more)

### Community 40 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 48 - "Blink — serviço de extração"
Cohesion: 0.17
Nodes (11): Avisos, Blink — serviço de extração, Conferir a extração sem subir nada, Contrato, Deploy, Formatos, Limites, O filtro (+3 more)

### Community 51 - "generate-cards-doc/index.ts"
Cohesion: 0.11
Nodes (26): answerLengthBias(), buildExtraction(), buildSystemPrompt(), buildUserBlocks(), Bundle, callModel(), CARD_SCHEMA, CatalogImage (+18 more)

### Community 55 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 63 - "database.ts"
Cohesion: 0.05
Nodes (83): AuthorReply(), CommunityDeckScreen(), Metric(), MiniAvatar(), PublishDeckScreen(), CreateDeckScreen(), EditDeckScreen(), NotificationController() (+75 more)

### Community 70 - "pdf.py"
Cohesion: 0.13
Nodes (24): Document, digest(), normalize(), Converte para JPEG RGB com teto de lado. None se não for imagem legível., extract_pdf(), _find_caption(), _first_rect(), _looks_vectorial() (+16 more)

### Community 78 - "progress.tsx"
Cohesion: 0.15
Nodes (20): accuracyColor(), DeckDetailScreen(), Tab, ProgressScreen(), DeckAvatar(), DeckAvatarProps, DeckMiniCard(), DeckMiniCardProps (+12 more)

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
Cohesion: 0.11
Nodes (27): Client, build_system_prompt(), call_anthropic(), call_gemini(), main(), Model, post(), Rodízio por página até encher o orçamento — igual à Edge Function. (+19 more)

## Ambiguous Edges - Review These
- `Blink Product Identity` → `Spaced Repetition Card Review Loop`  [AMBIGUOUS]
  assets/brand/blink_adaptive_foreground.png · relation: conceptually_related_to

## Knowledge Gaps
- **261 isolated node(s):** `graphify-context.sh script`, `name`, `slug`, `version`, `orientation` (+256 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Blink Product Identity` and `Spaced Repetition Card Review Loop`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `useThemeColors()` connect `useThemeColors` to `AiGeneratorForm.tsx`, `achievements.ts`, `SettingsContext.tsx`, `app/_layout.tsx`, `decks.tsx`, `index.tsx`, `progress.tsx`, `community.tsx`, `ActivityHeatmap.tsx`, `useSettings`, `database.ts`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `expo-router` connect `useThemeColors` to `AiGeneratorForm.tsx`, `achievements.ts`, `SettingsContext.tsx`, `app/_layout.tsx`, `decks.tsx`, `index.tsx`, `expo`, `progress.tsx`, `community.tsx`, `useSettings`, `database.ts`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `base64()` connect `AiGeneratorForm.tsx` to `generate-cards-doc/index.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `graphify-context.sh script`, `name`, `slug` to the rest of the system?**
  _261 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AiGeneratorForm.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08139534883720931 - nodes in this community are weakly interconnected._
- **Should `achievements.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09098039215686274 - nodes in this community are weakly interconnected._