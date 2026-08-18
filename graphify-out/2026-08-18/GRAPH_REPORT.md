# Graph Report - Blink  (2026-08-18)

## Corpus Check
- 155 files · ~494,845 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1038 nodes · 2645 edges · 87 communities (47 shown, 40 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d5a7b7d6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AiGeneratorForm.tsx
- types/index.ts
- database.ts
- TabBar.tsx
- backup.ts
- create.tsx
- settings.tsx
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
- decks.tsx
- Blink App Icon (1024px)
- ExtractedImage
- GlassSurface.tsx
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
- community.tsx
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
- useThemeColors
- community/[id].tsx
- @react-native-community/datetimepicker
- react-native-worklets
- graphify reference: transcribe video and audio
- CLAUDE.md
- extraction-spec.md
- edit.tsx
- pdf.py
- expo-secure-store
- images.ts
- expo
- expo-image-picker
- expo-linear-gradient
- expo-splash-screen
- react-native-safe-area-context
- DeckAvatar.tsx
- pptx.py
- docx.py
- imaging.py
- answer.ts
- ImportConflictModal.tsx
- storage.py
- Extractor
- expo-notifications

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

## Communities (87 total, 40 thin omitted)

### Community 0 - "AiGeneratorForm.tsx"
Cohesion: 0.08
Nodes (38): Attachment, ICON, ImportScreen(), KIND_LABEL, AiGeneratorForm(), Attachment, ATTACHMENT_ICON, DOCUMENT_PIPELINE (+30 more)

### Community 1 - "types/index.ts"
Cohesion: 0.07
Nodes (68): QuizScreen(), StudySessionScreen(), shuffle(), WriteScreen(), AiGeneratorFormProps, FinishPromptModal(), FlashCard(), FlashCardProps (+60 more)

### Community 2 - "database.ts"
Cohesion: 0.06
Nodes (67): AchievementsScreen(), stripEmoji(), LevelsScreen(), ProfileScreen(), ProgressScreen(), StatCard(), ActivityHeatmap(), ActivityHeatmapProps (+59 more)

### Community 3 - "TabBar.tsx"
Cohesion: 0.19
Nodes (10): TabsLayout(), TabBar(), TabSlotProps, IoniconName, TabBarIcon(), TabBarIconProps, TabIconName, TabBarCollapseContext (+2 more)

### Community 4 - "backup.ts"
Cohesion: 0.09
Nodes (35): accuracyColor(), DeckDetailScreen(), Tab, getDueCards(), APP, applyCardImport(), applyDeckImport(), BackupError (+27 more)

### Community 5 - "create.tsx"
Cohesion: 0.27
Nodes (13): AddCardsScreen(), Mode, CardEditorScreen(), CreateDeckScreen(), Mode, CardImages(), CardImagesProps, filledQuizOptions() (+5 more)

### Community 6 - "settings.tsx"
Cohesion: 0.18
Nodes (13): SettingsScreen(), SettingsRow(), SettingsRowProps, SettingsSection(), SettingsSectionProps, dateToHm(), hmToDate(), TimePickerRow() (+5 more)

### Community 7 - "expo"
Cohesion: 0.07
Nodes (27): backgroundColor, foregroundImage, adaptiveIcon, package, typedRoutes, expo, android, assetBundlePatterns (+19 more)

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
Cohesion: 0.10
Nodes (26): BaseModel, Exception, Options, Formato que nenhum extrator registrado sabe ler., Ajustes do extrator para uma chamada., UnsupportedFormat, DocxExtractor, Versão reduzida para o prompt. Falhou? devolve a original. (+18 more)

### Community 12 - "dependencies"
Cohesion: 0.18
Nodes (11): date-fns, expo-blur, expo-font, @expo-google-fonts/inter, dependencies, date-fns, expo-blur, expo-font (+3 more)

### Community 13 - "generate-cards/index.ts"
Cohesion: 0.18
Nodes (4): ContentType, CORS_HEADERS, GenerateRequest, Mode

### Community 14 - "Blink Adaptive Icon Foreground"
Cohesion: 0.36
Nodes (9): Android Adaptive Icon Foreground Layer, Blink Product Identity, Blink Brand Palette (Navy / Teal / Off-White), Flashcard Stack Motif, Curved Flip Arrow, Blink Adaptive Icon Foreground, Spaced Repetition Card Review Loop, Squircle App Container Shape (+1 more)

### Community 15 - "ooxml.py"
Cohesion: 0.12
Nodes (22): Figuras na ordem em que aparecem no documento, e depois as que estão no     paco, _read_images(), _BytesReader, is_media(), media_members(), natural_key(), open_zip(), parse_xml() (+14 more)

### Community 16 - "What You Must Do When Invoked"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 17 - "decks.tsx"
Cohesion: 0.17
Nodes (13): DECK_SORTS, DeckSort, DeckCard(), DeckCardProps, SortOption, LoadError(), LoadErrorProps, RevealSearchBar() (+5 more)

### Community 18 - "Blink App Icon (1024px)"
Cohesion: 0.62
Nodes (7): Blink Brand Palette (Deep Navy + Teal Accent + Off-White), Flashcard Stack Motif, Card Flip Arrow Glyph, Blink App Icon (1024px), Spaced Repetition Product Identity, Squircle Launcher Geometry (1024 Master Asset), Winking Face Mark (Blink)

### Community 19 - "ExtractedImage"
Cohesion: 0.13
Nodes (11): Any, Bundle, ExtractedImage, Contrato comum a todos os formatos.  A regra que sustenta o roteador: seja PDF,, Resultado completo: o JSON que a IA vai consumir + os bytes a subir., Registra um aviso uma única vez., Figura encontrada no documento, já normalizada e pronta para subir., extract_image() (+3 more)

### Community 20 - "GlassSurface.tsx"
Cohesion: 0.12
Nodes (26): DeckOption, DeckPickerModal(), Props, EnterAnimationProps, FilterSheet(), FilterSheetProps, Props, ModeOption (+18 more)

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
Nodes (39): plugins, FONT_BASE, FONT_SCALE, LEADING_BASE, NotificationController(), RootNavigator(), THEME_MAP, ThemeController() (+31 more)

### Community 37 - "community.tsx"
Cohesion: 0.22
Nodes (15): COMMUNITY_SORTS, CommunityScreen(), LIST_TITLE, DecksScreen(), HomeScreen(), EnterAnimation(), useRevealSearch(), useStudyModePicker() (+7 more)

### Community 40 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 48 - "Blink — serviço de extração"
Cohesion: 0.17
Nodes (11): Avisos, Blink — serviço de extração, Conferir a extração sem subir nada, Contrato, Deploy, Formatos, Limites, O filtro (+3 more)

### Community 51 - "generate-cards-doc/index.ts"
Cohesion: 0.14
Nodes (19): buildExtraction(), buildSystemPrompt(), buildUserBlocks(), Bundle, callModel(), CARD_SCHEMA, CatalogImage, CORS_HEADERS (+11 more)

### Community 55 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 62 - "useThemeColors"
Cohesion: 0.13
Nodes (23): ForgotPasswordScreen(), LoginScreen(), mapAuthError(), FieldErrors, RegisterScreen(), ResetPasswordScreen(), ProgressRing(), ProgressRingProps (+15 more)

### Community 63 - "community/[id].tsx"
Cohesion: 0.12
Nodes (36): AuthorReply(), CommunityDeckScreen(), Metric(), MiniAvatar(), PublishDeckScreen(), PublishToggleProps, CommunitySort, downloadDeck() (+28 more)

### Community 69 - "edit.tsx"
Cohesion: 0.31
Nodes (9): EditDeckScreen(), PublishToggle(), normalizeTag(), TagInput(), TagInputProps, getPublishedFor(), publishDeck(), unpublishDeck() (+1 more)

### Community 70 - "pdf.py"
Cohesion: 0.16
Nodes (21): Document, digest(), normalize(), Converte para JPEG RGB com teto de lado. None se não for imagem legível., extract_pdf(), _find_caption(), _first_rect(), _looks_vectorial() (+13 more)

### Community 72 - "images.ts"
Cohesion: 0.19
Nodes (12): CardImagePicker(), CardImagePickerProps, DeckCoverPicker(), DeckCoverPickerProps, GradeErrorCode, GradeParams, GradeResult, CardImage (+4 more)

### Community 78 - "DeckAvatar.tsx"
Cohesion: 0.40
Nodes (4): DeckAvatar(), DeckAvatarProps, DeckMiniCard(), DeckMiniCardProps

### Community 79 - "pptx.py"
Cohesion: 0.23
Nodes (14): extract_pptx(), _notes_text(), Bundle, Element, ZipFile, PPTX — o formato mais importante para o Blink.  Slide de aula é o material que o, Slides na ordem da apresentação, não na ordem do nome do arquivo., Um parágrafo por linha — é assim que o texto do slide se lê. (+6 more)

### Community 80 - "docx.py"
Cohesion: 0.29
Nodes (9): extract_docx(), Bundle, Element, ZipFile, DOCX — Word.  Mais simples que o PDF pelo mesmo motivo do PPTX: as figuras já es, Texto na ordem do documento; tabelas à parte, em markdown., _read_body(), _table_markdown() (+1 more)

### Community 81 - "imaging.py"
Cohesion: 0.24
Nodes (10): apply_filter(), _cap_candidates(), is_flat(), postprocess(), Bundle, Normalização e pré-limpeza de figuras — compartilhadas por TODOS os formatos.  E, Pré-limpeza barata. Marca como descartada e por quê — não remove: o motivo     é, Segunda passada, depois que todas as figuras do arquivo são conhecidas:     temp (+2 more)

### Community 82 - "answer.ts"
Cohesion: 0.39
Nodes (8): AnswerCheck, AnswerVerdict, checkAnswer(), keywords(), levenshtein(), normalizeAnswer(), present(), STOPWORDS

### Community 83 - "ImportConflictModal.tsx"
Cohesion: 0.36
Nodes (6): ConflictResolution, ImportConflictModal(), Props, ConflictAction, DeckConflict, ImportDeck

### Community 84 - "storage.py"
Cohesion: 0.52
Nodes (6): download(), _headers(), Cliente mínimo do Supabase Storage.  A API REST do Storage é simples o bastante, StorageError, upload(), RuntimeError

### Community 85 - "Extractor"
Cohesion: 0.33
Nodes (4): Extractor, Um formato de arquivo. Toda implementação devolve o MESMO `Bundle`, e é a     ún, Este extrator sabe ler o arquivo?, Protocol

## Ambiguous Edges - Review These
- `Blink Product Identity` → `Spaced Repetition Card Review Loop`  [AMBIGUOUS]
  assets/brand/blink_adaptive_foreground.png · relation: conceptually_related_to

## Knowledge Gaps
- **259 isolated node(s):** `graphify-context.sh script`, `name`, `slug`, `version`, `orientation` (+254 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Blink Product Identity` and `Spaced Repetition Card Review Loop`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `useThemeColors()` connect `useThemeColors` to `AiGeneratorForm.tsx`, `types/index.ts`, `database.ts`, `TabBar.tsx`, `backup.ts`, `edit.tsx`, `create.tsx`, `app/_layout.tsx`, `settings.tsx`, `community.tsx`, `images.ts`, `DeckAvatar.tsx`, `decks.tsx`, `ImportConflictModal.tsx`, `GlassSurface.tsx`, `community/[id].tsx`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `expo-router` connect `useThemeColors` to `AiGeneratorForm.tsx`, `types/index.ts`, `database.ts`, `TabBar.tsx`, `backup.ts`, `edit.tsx`, `create.tsx`, `app/_layout.tsx`, `settings.tsx`, `community.tsx`, `decks.tsx`, `GlassSurface.tsx`, `community/[id].tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `plugins` connect `app/_layout.tsx` to `useThemeColors`, `expo`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `graphify-context.sh script`, `name`, `slug` to the rest of the system?**
  _259 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AiGeneratorForm.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08139534883720931 - nodes in this community are weakly interconnected._
- **Should `types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06541822721598002 - nodes in this community are weakly interconnected._