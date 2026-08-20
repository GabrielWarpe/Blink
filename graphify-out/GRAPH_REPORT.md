# Graph Report - Blink  (2026-08-19)

## Corpus Check
- 156 files · ~126,815 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1095 nodes · 2657 edges · 89 communities (49 shown, 40 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 59 edges (avg confidence: 0.67)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e8fb401b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AiGeneratorForm.tsx
- ExtractedImage
- progress.tsx
- types/index.ts
- backup.ts
- test-generate-cards.js
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
- decks.tsx
- Blink App Icon (1024px)
- profile.tsx
- useGlass
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
- settings.tsx
- onboarding.tsx
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
- useSettings
- @react-native-community/datetimepicker
- react-native-worklets
- graphify reference: transcribe video and audio
- CLAUDE.md
- extraction-spec.md
- TabBar.tsx
- pdf.py
- expo-secure-store
- Deck
- ImportConflictModal.tsx
- expo
- index.tsx
- pptx.py
- docx.py
- imaging.py
- answer.ts
- deck/[id].tsx
- benchmark.py
- notifications.ts
- useGlass.ts
- plugins
- expo-image-picker
- expo-linear-gradient
- expo-notifications
- expo-splash-screen
- react-native-safe-area-context

## God Nodes (most connected - your core abstractions)
1. `useThemeColors()` - 124 edges
2. `useAuth()` - 49 edges
3. `expo-router` - 33 edges
4. `useSettings()` - 33 edges
5. `ExtractedImage` - 25 edges
6. `db` - 24 edges
7. `Options` - 23 edges
8. `useGlass()` - 22 edges
9. `Deck` - 22 edges
10. `Bundle` - 20 edges

## Surprising Connections (you probably didn't know these)
- `useStudyTimer()` --indirect_call--> `check()`  [INFERRED]
  hooks/useStudyTimer.ts → scripts/test-generate-cards.js
- `AiGeneratorForm()` --indirect_call--> `base64()`  [INFERRED]
  components/AiGeneratorForm.tsx → supabase/functions/generate-cards-doc/index.ts
- `AddCardsScreen()` --indirect_call--> `card()`  [INFERRED]
  app/deck/add-cards.tsx → scripts/test-generate-cards.js
- `useStudySession()` --indirect_call--> `card()`  [INFERRED]
  hooks/useStudySession.ts → scripts/test-generate-cards.js
- `ImportScreen()` --indirect_call--> `base64()`  [INFERRED]
  app/deck/import.tsx → supabase/functions/generate-cards-doc/index.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Pipeline de IA server-side (Claude via Edge Function)** — readme_geracao_com_ia, readme_modo_escrever, readme_edge_function, readme_claude_ia, readme_anthropic_api_key_secret [INFERRED 0.85]
- **Modelo de dados Supabase com RLS** — readme_supabase, readme_row_level_security, readme_schema_sql, readme_tabela_profiles, readme_tabela_flashcards [INFERRED 0.85]
- **Loop de estudo SM-2 e metricas** — readme_repeticao_espacada_sm2, readme_tabela_flashcards, readme_tabela_study_sessions, readme_tabela_card_reviews [INFERRED 0.75]
- **Blink Icon Visual Language** — assets_brand_blink_adaptive_foreground_flashcard_stack, assets_brand_blink_adaptive_foreground_wink_face, assets_brand_blink_adaptive_foreground_flip_arrow, assets_brand_blink_adaptive_foreground_brand_palette, assets_brand_blink_adaptive_foreground_squircle_container [INFERRED 0.85]

## Communities (89 total, 40 thin omitted)

### Community 0 - "AiGeneratorForm.tsx"
Cohesion: 0.08
Nodes (37): Attachment, ICON, ImportScreen(), KIND_LABEL, AiGeneratorForm(), AiGeneratorFormProps, Attachment, ATTACHMENT_ICON (+29 more)

### Community 1 - "ExtractedImage"
Cohesion: 0.12
Nodes (13): Any, Bundle, ExtractedImage, Resultado completo: o JSON que a IA vai consumir + os bytes a subir., Registra um aviso uma única vez., Figura encontrada no documento, já normalizada e pronta para subir., extract_image(), ImageExtractor (+5 more)

### Community 2 - "progress.tsx"
Cohesion: 0.06
Nodes (55): AchievementsScreen(), stripEmoji(), LevelsScreen(), ProgressScreen(), StatCard(), ActivityHeatmap(), ActivityHeatmapProps, alphaHex() (+47 more)

### Community 3 - "types/index.ts"
Cohesion: 0.06
Nodes (67): QuizScreen(), StudySessionScreen(), shuffle(), WriteScreen(), FinishPromptModal(), Props, FlashCard(), FlashCardProps (+59 more)

### Community 4 - "backup.ts"
Cohesion: 0.13
Nodes (25): DecksScreen(), useRevealSearch(), APP, applyCardImport(), applyDeckImport(), BackupResult, buildImportPlan(), CardBundleFile (+17 more)

### Community 5 - "test-generate-cards.js"
Cohesion: 0.10
Nodes (18): CreateDeckScreen(), card(), catalog, check(), cinco, equilibrado, fs, path (+10 more)

### Community 6 - "useThemeColors"
Cohesion: 0.05
Nodes (97): ForgotPasswordScreen(), LoginScreen(), mapAuthError(), FieldErrors, RegisterScreen(), AuthorReply(), CommunityDeckScreen(), Metric() (+89 more)

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
Cohesion: 0.14
Nodes (17): Exception, Extractor, Options, Contrato comum a todos os formatos.  A regra que sustenta o roteador: seja PDF,, Um formato de arquivo. Toda implementação devolve o MESMO `Bundle`, e é a     ún, Este extrator sabe ler o arquivo?, Formato que nenhum extrator registrado sabe ler., Ajustes do extrator para uma chamada. (+9 more)

### Community 12 - "dependencies"
Cohesion: 0.18
Nodes (11): date-fns, expo-blur, expo-font, @expo-google-fonts/inter, dependencies, date-fns, expo-blur, expo-font (+3 more)

### Community 13 - "generate-cards/index.ts"
Cohesion: 0.17
Nodes (7): callGemini(), ContentType, CORS_HEADERS, GEMINI_MODELS, GenerateRequest, json(), Mode

### Community 14 - "Blink Adaptive Icon Foreground"
Cohesion: 0.36
Nodes (9): Android Adaptive Icon Foreground Layer, Blink Product Identity, Blink Brand Palette (Navy / Teal / Off-White), Flashcard Stack Motif, Curved Flip Arrow, Blink Adaptive Icon Foreground, Spaced Repetition Card Review Loop, Squircle App Container Shape (+1 more)

### Community 15 - "ooxml.py"
Cohesion: 0.12
Nodes (20): _BytesReader, is_media(), media_members(), natural_key(), open_zip(), parse_xml(), Element, ZipFile (+12 more)

### Community 16 - "What You Must Do When Invoked"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 17 - "decks.tsx"
Cohesion: 0.13
Nodes (18): COMMUNITY_SORTS, LIST_TITLE, DECK_SORTS, DeckSort, DeckCard(), EnterAnimation(), LoadError(), LoadErrorProps (+10 more)

### Community 18 - "Blink App Icon (1024px)"
Cohesion: 0.62
Nodes (7): Blink Brand Palette (Deep Navy + Teal Accent + Off-White), Flashcard Stack Motif, Card Flip Arrow Glyph, Blink App Icon (1024px), Spaced Repetition Product Identity, Squircle Launcher Geometry (1024 Master Asset), Winking Face Mark (Blink)

### Community 19 - "profile.tsx"
Cohesion: 0.20
Nodes (11): ProfileScreen(), GoalSlider(), GoalSliderProps, SettingsSection(), SettingsSectionProps, AnimatedBlurView, AnimatedPressable, GlassPressable() (+3 more)

### Community 20 - "useGlass"
Cohesion: 0.21
Nodes (13): DeckOption, DeckPickerModal(), Props, FilterSheet(), FilterSheetProps, SortOption, ModeOption, StudyModePicker() (+5 more)

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

### Community 36 - "settings.tsx"
Cohesion: 0.22
Nodes (11): SettingsScreen(), SettingsRow(), SettingsRowProps, dateToHm(), hmToDate(), TimePickerRow(), TimePickerRowProps, Toggle() (+3 more)

### Community 37 - "onboarding.tsx"
Cohesion: 0.12
Nodes (13): RootNavigator(), OnboardingScreen(), Slide, SlideFace(), SLIDES, DARK_COLORS, DECK_COLORS, LIGHT_COLORS (+5 more)

### Community 40 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 48 - "Blink — serviço de extração"
Cohesion: 0.17
Nodes (11): Avisos, Blink — serviço de extração, Conferir a extração sem subir nada, Contrato, Deploy, Formatos, Limites, O filtro (+3 more)

### Community 51 - "generate-cards-doc/index.ts"
Cohesion: 0.10
Nodes (30): answerLengthBias(), base64(), buildExtraction(), buildSystemPrompt(), buildUserBlocks(), Bundle, callAnthropic(), callGemini() (+22 more)

### Community 55 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 62 - "useSettings"
Cohesion: 0.19
Nodes (11): FONT_BASE, FONT_SCALE, LEADING_BASE, NotificationController(), THEME_MAP, ThemeController(), ThemeVarsView(), ACCENT (+3 more)

### Community 69 - "TabBar.tsx"
Cohesion: 0.19
Nodes (10): TabsLayout(), TabBar(), TabSlotProps, IoniconName, TabBarIcon(), TabBarIconProps, TabIconName, TabBarCollapseContext (+2 more)

### Community 70 - "pdf.py"
Cohesion: 0.13
Nodes (22): Document, extract_pdf(), _find_caption(), _first_rect(), _looks_vectorial(), PdfExtractor, Bundle, PDF — o formato mais rico e o mais difícil.  Texto por página, figuras embutidas (+14 more)

### Community 72 - "Deck"
Cohesion: 0.28
Nodes (7): DeckAvatar(), DeckAvatarProps, DeckCardProps, DeckMiniCard(), DeckMiniCardProps, StudyModePickerProps, Deck

### Community 73 - "ImportConflictModal.tsx"
Cohesion: 0.31
Nodes (7): ConflictResolution, ImportConflictModal(), Props, GlassSurface(), ConflictAction, DeckConflict, ImportDeck

### Community 78 - "index.tsx"
Cohesion: 0.23
Nodes (10): CommunityScreen(), HomeScreen(), ProgressRing(), ProgressRingProps, useDecks(), useReplayOnFocus(), useTabBarInset(), SPRING (+2 more)

### Community 79 - "pptx.py"
Cohesion: 0.20
Nodes (15): extract_pptx(), _notes_text(), PptxExtractor, Bundle, Element, ZipFile, PPTX — o formato mais importante para o Blink.  Slide de aula é o material que o, Slides na ordem da apresentação, não na ordem do nome do arquivo. (+7 more)

### Community 80 - "docx.py"
Cohesion: 0.23
Nodes (12): DocxExtractor, extract_docx(), Bundle, Element, ZipFile, DOCX — Word.  Mais simples que o PDF pelo mesmo motivo do PPTX: as figuras já es, Figuras na ordem em que aparecem no documento, e depois as que estão no     paco, Texto na ordem do documento; tabelas à parte, em markdown. (+4 more)

### Community 81 - "imaging.py"
Cohesion: 0.21
Nodes (12): apply_filter(), _cap_candidates(), is_flat(), postprocess(), Bundle, Normalização e pré-limpeza de figuras — compartilhadas por TODOS os formatos.  E, Pré-limpeza barata. Marca como descartada e por quê — não remove: o motivo     é, Segunda passada, depois que todas as figuras do arquivo são conhecidas:     temp (+4 more)

### Community 82 - "answer.ts"
Cohesion: 0.39
Nodes (8): AnswerCheck, AnswerVerdict, checkAnswer(), keywords(), levenshtein(), normalizeAnswer(), present(), STOPWORDS

### Community 83 - "deck/[id].tsx"
Cohesion: 0.24
Nodes (10): accuracyColor(), DeckDetailScreen(), Tab, useStudyModePicker(), getDueCards(), BackupError, exportCards(), exportDeck() (+2 more)

### Community 84 - "benchmark.py"
Cohesion: 0.09
Nodes (34): BaseModel, Client, _authorize(), extract_document(), ExtractRequest, health(), Serviço de extração de documentos do Blink.  Um endpoint só: recebe o ponteiro d, build_system_prompt() (+26 more)

### Community 85 - "notifications.ts"
Cohesion: 0.35
Nodes (10): androidChannel(), dateAt(), dueCountAt(), ensureAndroidChannel(), fireNotification(), fireStreakNotification(), parseTime(), ReminderConfig (+2 more)

### Community 87 - "useGlass.ts"
Cohesion: 0.36
Nodes (7): EnterAnimationProps, compensateWeakBlur(), GLASS_DARK, GLASS_LIGHT, glassShadow, GlassTokens, reAlpha()

### Community 89 - "plugins"
Cohesion: 0.33
Nodes (6): plugins, expo-asset, expo-font, expo-notifications, expo-secure-store, @react-native-community/datetimepicker

## Ambiguous Edges - Review These
- `Blink Product Identity` → `Spaced Repetition Card Review Loop`  [AMBIGUOUS]
  assets/brand/blink_adaptive_foreground.png · relation: conceptually_related_to

## Knowledge Gaps
- **282 isolated node(s):** `PublicIdentity`, `Mode`, `Attachment`, `ATTACHMENT_ICON`, `AiGeneratorFormProps` (+277 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Blink Product Identity` and `Spaced Repetition Card Review Loop`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `useThemeColors()` connect `useThemeColors` to `AiGeneratorForm.tsx`, `progress.tsx`, `types/index.ts`, `settings.tsx`, `onboarding.tsx`, `backup.ts`, `TabBar.tsx`, `Deck`, `ImportConflictModal.tsx`, `index.tsx`, `decks.tsx`, `deck/[id].tsx`, `profile.tsx`, `useGlass`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `base64()` connect `generate-cards-doc/index.ts` to `AiGeneratorForm.tsx`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `expo-router` connect `useThemeColors` to `AiGeneratorForm.tsx`, `progress.tsx`, `types/index.ts`, `settings.tsx`, `onboarding.tsx`, `TabBar.tsx`, `index.tsx`, `decks.tsx`, `deck/[id].tsx`, `profile.tsx`, `useGlass`, `plugins`, `useSettings`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `PublicIdentity`, `Mode`, `Attachment` to the rest of the system?**
  _282 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AiGeneratorForm.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07641196013289037 - nodes in this community are weakly interconnected._
- **Should `ExtractedImage` be split into smaller, more focused modules?**
  _Cohesion score 0.11956521739130435 - nodes in this community are weakly interconnected._