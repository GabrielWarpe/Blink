# Graph Report - Blink  (2026-08-07)

## Corpus Check
- 145 files · ~109,361 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 905 nodes · 2316 edges · 78 communities (38 shown, 40 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bb01efb9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AiGeneratorForm.tsx
- write/[deckId].tsx
- achievements.ts
- useTabBarScroll
- progress.tsx
- create.tsx
- useThemeColors
- expo
- Blink (flashcards app)
- package.json
- include
- extract.py
- dependencies
- generate-cards/index.ts
- Blink Adaptive Icon Foreground
- expo
- What You Must Do When Invoked
- decks.tsx
- Blink App Icon (1024px)
- profile.tsx
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
- useAuth
- community/[id].tsx
- @react-native-community/datetimepicker
- react-native-worklets
- graphify reference: transcribe video and audio
- CLAUDE.md
- extraction-spec.md
- edit.tsx
- database.ts
- expo-secure-store
- supabase.ts
- date-fns
- expo-image-picker
- expo-linear-gradient
- expo-splash-screen
- react-native-safe-area-context

## God Nodes (most connected - your core abstractions)
1. `useThemeColors()` - 126 edges
2. `useAuth()` - 50 edges
3. `useSettings()` - 36 edges
4. `expo-router` - 32 edges
5. `db` - 24 edges
6. `useGlass()` - 22 edges
7. `Deck` - 22 edges
8. `Flashcard` - 20 edges
9. `Button()` - 19 edges
10. `DecksScreen()` - 18 edges

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

## Communities (78 total, 40 thin omitted)

### Community 0 - "AiGeneratorForm.tsx"
Cohesion: 0.12
Nodes (24): AiGeneratorForm(), Attachment, ATTACHMENT_ICON, detectFileContentType(), generateCards(), GenerateContentType, GeneratedFlashcard, GeneratedQuizQuestion (+16 more)

### Community 1 - "write/[deckId].tsx"
Cohesion: 0.06
Nodes (67): QuizScreen(), SettingsScreen(), StudySessionScreen(), shuffle(), WriteScreen(), AiGeneratorFormProps, FinishPromptModal(), FlashCard() (+59 more)

### Community 2 - "achievements.ts"
Cohesion: 0.09
Nodes (38): AchievementsScreen(), stripEmoji(), LevelsScreen(), Emblem(), EmblemProps, GameIcon(), GameIconProps, GAME_ICON_PATHS (+30 more)

### Community 3 - "useTabBarScroll"
Cohesion: 0.16
Nodes (12): TabsLayout(), TabBar(), TabSlotProps, IoniconName, TabBarIcon(), TabBarIconProps, TabIconName, TabBarCollapseContext (+4 more)

### Community 4 - "progress.tsx"
Cohesion: 0.05
Nodes (59): accuracyColor(), DeckDetailScreen(), Tab, ProgressScreen(), ActivityHeatmap(), ActivityHeatmapProps, alphaHex(), levelFor() (+51 more)

### Community 5 - "create.tsx"
Cohesion: 0.19
Nodes (20): AddCardsScreen(), Mode, CardEditorScreen(), CreateDeckScreen(), Mode, CardImagePicker(), CardImagePickerProps, CardImages() (+12 more)

### Community 6 - "useThemeColors"
Cohesion: 0.11
Nodes (21): LoadError(), LoadErrorProps, ProgressRing(), ProgressRingProps, RevealSearchBar(), RevealSearchBarProps, SearchToggleButton(), SearchToggleButtonProps (+13 more)

### Community 7 - "expo"
Cohesion: 0.07
Nodes (28): backgroundColor, foregroundImage, adaptiveIcon, package, typedRoutes, expo, android, assetBundlePatterns (+20 more)

### Community 8 - "Blink (flashcards app)"
Cohesion: 0.11
Nodes (25): graphify knowledge graph workflow, ANTHROPIC_API_KEY como segredo de servidor, Blink (flashcards app), Bucket card-images (Storage), Claude (LLM), Comunidade (decks snapshot), Supabase Edge Function (Claude server-side), Expo / React Native stack (+17 more)

### Community 9 - "package.json"
Cohesion: 0.11
Nodes (17): @babel/core, @expo/ngrok, devDependencies, @babel/core, @expo/ngrok, @types/react, typescript, main (+9 more)

### Community 10 - "include"
Cohesion: 0.11
Nodes (17): expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.d.ts, .expo/types/**/*.ts, nativewind-env.d.ts, node_modules, supabase/functions, **/*.ts (+9 more)

### Community 11 - "extract.py"
Cohesion: 0.07
Nodes (42): Any, BaseModel, Document, Exception, _apply_filter(), Bundle, extract(), extract_pdf() (+34 more)

### Community 12 - "dependencies"
Cohesion: 0.18
Nodes (11): expo-blur, expo-font, @expo-google-fonts/inter, expo-notifications, dependencies, expo-blur, expo-font, @expo-google-fonts/inter (+3 more)

### Community 13 - "generate-cards/index.ts"
Cohesion: 0.18
Nodes (4): ContentType, CORS_HEADERS, GenerateRequest, Mode

### Community 14 - "Blink Adaptive Icon Foreground"
Cohesion: 0.36
Nodes (9): Android Adaptive Icon Foreground Layer, Blink Product Identity, Blink Brand Palette (Navy / Teal / Off-White), Flashcard Stack Motif, Curved Flip Arrow, Blink Adaptive Icon Foreground, Spaced Repetition Card Review Loop, Squircle App Container Shape (+1 more)

### Community 16 - "What You Must Do When Invoked"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 17 - "decks.tsx"
Cohesion: 0.16
Nodes (17): DECK_SORTS, DeckSort, DecksScreen(), DeckCard(), ConflictResolution, ImportConflictModal(), Props, CardProps (+9 more)

### Community 18 - "Blink App Icon (1024px)"
Cohesion: 0.62
Nodes (7): Blink Brand Palette (Deep Navy + Teal Accent + Off-White), Flashcard Stack Motif, Card Flip Arrow Glyph, Blink App Icon (1024px), Spaced Repetition Product Identity, Squircle Launcher Geometry (1024 Master Asset), Winking Face Mark (Blink)

### Community 19 - "profile.tsx"
Cohesion: 0.28
Nodes (7): ProfileScreen(), StatCard(), GoalSlider(), GoalSliderProps, SettingsSection(), Card(), useGlassEdge()

### Community 20 - "GlassSurface.tsx"
Cohesion: 0.12
Nodes (26): DeckOption, DeckPickerModal(), Props, FilterSheet(), FilterSheetProps, Props, SettingsSectionProps, ModeOption (+18 more)

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
Nodes (40): plugins, FONT_BASE, FONT_SCALE, LEADING_BASE, NotificationController(), RootNavigator(), THEME_MAP, ThemeController() (+32 more)

### Community 37 - "community.tsx"
Cohesion: 0.22
Nodes (13): COMMUNITY_SORTS, CommunityScreen(), LIST_TITLE, HomeScreen(), EnterAnimation(), EnterAnimationProps, SortOption, useRevealSearch() (+5 more)

### Community 40 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 48 - "Blink — serviço de extração"
Cohesion: 0.25
Nodes (7): Blink — serviço de extração, Contrato, Deploy, O filtro, PDF digitalizado, Rodar local, Variáveis de ambiente

### Community 51 - "generate-cards-doc/index.ts"
Cohesion: 0.17
Nodes (16): base64(), buildSystemPrompt(), buildUserBlocks(), Bundle, callModel(), CARD_SCHEMA, CatalogImage, CORS_HEADERS (+8 more)

### Community 55 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 62 - "useAuth"
Cohesion: 0.17
Nodes (15): ForgotPasswordScreen(), LoginScreen(), mapAuthError(), FieldErrors, RegisterScreen(), ResetPasswordScreen(), Button(), ButtonProps (+7 more)

### Community 63 - "community/[id].tsx"
Cohesion: 0.19
Nodes (21): AuthorReply(), CommunityDeckScreen(), Metric(), MiniAvatar(), CommunitySort, downloadDeck(), getCommunityDeck(), getMyRating() (+13 more)

### Community 69 - "edit.tsx"
Cohesion: 0.23
Nodes (18): PublishDeckScreen(), EditDeckScreen(), PublishToggle(), PublishToggleProps, normalizeTag(), TagInput(), TagInputProps, useDecks() (+10 more)

### Community 70 - "database.ts"
Cohesion: 0.16
Nodes (15): AuthContextType, NewDeckInput, sanitizeInterval(), NewCardInput, NewFlashcardRow, rowsToDeck(), rowToFlashcard(), CardReviewRow (+7 more)

### Community 72 - "supabase.ts"
Cohesion: 0.29
Nodes (6): GradeErrorCode, GradeParams, GradeResult, expo-secure-store, ExpoSecureStoreAdapter, supabase

## Ambiguous Edges - Review These
- `Blink Product Identity` → `Spaced Repetition Card Review Loop`  [AMBIGUOUS]
  assets/brand/blink_adaptive_foreground.png · relation: conceptually_related_to

## Knowledge Gaps
- **248 isolated node(s):** `graphify-context.sh script`, `name`, `slug`, `version`, `orientation` (+243 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Blink Product Identity` and `Spaced Repetition Card Review Loop`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `useThemeColors()` connect `useThemeColors` to `AiGeneratorForm.tsx`, `write/[deckId].tsx`, `achievements.ts`, `useTabBarScroll`, `progress.tsx`, `create.tsx`, `edit.tsx`, `app/_layout.tsx`, `community.tsx`, `decks.tsx`, `profile.tsx`, `GlassSurface.tsx`, `useAuth`, `community/[id].tsx`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `expo-router` connect `useAuth` to `write/[deckId].tsx`, `achievements.ts`, `useTabBarScroll`, `progress.tsx`, `create.tsx`, `edit.tsx`, `app/_layout.tsx`, `community.tsx`, `database.ts`, `decks.tsx`, `profile.tsx`, `GlassSurface.tsx`, `community/[id].tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `plugins` connect `app/_layout.tsx` to `supabase.ts`, `useAuth`, `expo`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `graphify-context.sh script`, `name`, `slug` to the rest of the system?**
  _248 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AiGeneratorForm.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1225071225071225 - nodes in this community are weakly interconnected._
- **Should `write/[deckId].tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06183310533515732 - nodes in this community are weakly interconnected._