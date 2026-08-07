# Graph Report - Recall  (2026-08-01)

## Corpus Check
- 144 files · ~108,905 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 901 nodes · 2313 edges · 73 communities (34 shown, 39 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d1fda37c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useThemeColors
- types/index.ts
- achievements.ts
- TabBar.tsx
- decks.tsx
- database.ts
- settings.tsx
- expo
- Blink (flashcards app)
- package.json
- include
- answer.ts
- dependencies
- generate-cards/index.ts
- Blink Adaptive Icon Foreground
- expo
- What You Must Do When Invoked
- progress.tsx
- Blink App Icon (1024px)
- index.tsx
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
- answer.ts
- @react-native-community/datetimepicker
- react-native-worklets
- graphify reference: transcribe video and audio
- CLAUDE.md
- extraction-spec.md
- expo-image-picker
- expo-secure-store
- expo-linear-gradient
- expo-notifications
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

## Communities (73 total, 39 thin omitted)

### Community 0 - "useThemeColors"
Cohesion: 0.06
Nodes (70): ForgotPasswordScreen(), LoginScreen(), mapAuthError(), FieldErrors, RegisterScreen(), AddCardsScreen(), Mode, CardEditorScreen() (+62 more)

### Community 1 - "types/index.ts"
Cohesion: 0.06
Nodes (73): QuizScreen(), SettingsScreen(), StudySessionScreen(), shuffle(), WriteScreen(), AiGeneratorFormProps, DeckCardProps, FinishPromptModal() (+65 more)

### Community 2 - "achievements.ts"
Cohesion: 0.09
Nodes (39): AchievementsScreen(), stripEmoji(), LevelsScreen(), ProgressScreen(), Emblem(), EmblemProps, GameIcon(), GameIconProps (+31 more)

### Community 3 - "TabBar.tsx"
Cohesion: 0.19
Nodes (10): TabsLayout(), TabBar(), TabSlotProps, IoniconName, TabBarIcon(), TabBarIconProps, TabIconName, TabBarCollapseContext (+2 more)

### Community 4 - "decks.tsx"
Cohesion: 0.09
Nodes (39): DECK_SORTS, DeckSort, DecksScreen(), ConflictResolution, ImportConflictModal(), Props, useReplayOnFocus(), APP (+31 more)

### Community 5 - "database.ts"
Cohesion: 0.07
Nodes (60): AuthorReply(), CommunityDeckScreen(), Metric(), MiniAvatar(), PublishDeckScreen(), EditDeckScreen(), PublishToggle(), PublishToggleProps (+52 more)

### Community 6 - "settings.tsx"
Cohesion: 0.25
Nodes (8): SettingsRow(), SettingsRowProps, dateToHm(), hmToDate(), TimePickerRow(), TimePickerRowProps, Toggle(), ToggleProps

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

### Community 11 - "answer.ts"
Cohesion: 0.07
Nodes (39): Any, BaseModel, Document, Exception, _apply_filter(), Bundle, extract(), extract_pdf() (+31 more)

### Community 12 - "dependencies"
Cohesion: 0.18
Nodes (11): date-fns, expo-blur, expo-font, @expo-google-fonts/inter, dependencies, date-fns, expo-blur, expo-font (+3 more)

### Community 13 - "generate-cards/index.ts"
Cohesion: 0.18
Nodes (4): ContentType, CORS_HEADERS, GenerateRequest, Mode

### Community 14 - "Blink Adaptive Icon Foreground"
Cohesion: 0.36
Nodes (9): Android Adaptive Icon Foreground Layer, Blink Product Identity, Blink Brand Palette (Navy / Teal / Off-White), Flashcard Stack Motif, Curved Flip Arrow, Blink Adaptive Icon Foreground, Spaced Repetition Card Review Loop, Squircle App Container Shape (+1 more)

### Community 16 - "What You Must Do When Invoked"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 17 - "progress.tsx"
Cohesion: 0.17
Nodes (15): accuracyColor(), DeckDetailScreen(), Tab, StreakBadge(), StreakBadgeProps, ModeOption, StudyModePicker(), StudyModePickerProps (+7 more)

### Community 18 - "Blink App Icon (1024px)"
Cohesion: 0.62
Nodes (7): Blink Brand Palette (Deep Navy + Teal Accent + Off-White), Flashcard Stack Motif, Card Flip Arrow Glyph, Blink App Icon (1024px), Spaced Repetition Product Identity, Squircle Launcher Geometry (1024 Master Asset), Winking Face Mark (Blink)

### Community 19 - "index.tsx"
Cohesion: 0.21
Nodes (11): HomeScreen(), ProfileScreen(), GoalSlider(), GoalSliderProps, Card(), useStreak(), useTabBarInset(), SPRING (+3 more)

### Community 20 - "GlassSurface.tsx"
Cohesion: 0.10
Nodes (31): StatCard(), DeckCard(), DeckOption, DeckPickerModal(), Props, EnterAnimation(), EnterAnimationProps, FilterSheet() (+23 more)

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
Cohesion: 0.13
Nodes (17): COMMUNITY_SORTS, CommunityScreen(), LIST_TITLE, DeckAvatar(), DeckAvatarProps, DeckMiniCard(), DeckMiniCardProps, LoadError() (+9 more)

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

### Community 61 - "answer.ts"
Cohesion: 0.39
Nodes (8): AnswerCheck, AnswerVerdict, checkAnswer(), keywords(), levenshtein(), normalizeAnswer(), present(), STOPWORDS

## Ambiguous Edges - Review These
- `Blink Product Identity` → `Spaced Repetition Card Review Loop`  [AMBIGUOUS]
  assets/brand/blink_adaptive_foreground.png · relation: conceptually_related_to

## Knowledge Gaps
- **247 isolated node(s):** `name`, `slug`, `version`, `orientation`, `userInterfaceStyle` (+242 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **39 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Blink Product Identity` and `Spaced Repetition Card Review Loop`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `useThemeColors()` connect `useThemeColors` to `types/index.ts`, `achievements.ts`, `TabBar.tsx`, `app/_layout.tsx`, `database.ts`, `community.tsx`, `decks.tsx`, `settings.tsx`, `progress.tsx`, `index.tsx`, `GlassSurface.tsx`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `expo-router` connect `index.tsx` to `useThemeColors`, `types/index.ts`, `achievements.ts`, `TabBar.tsx`, `app/_layout.tsx`, `database.ts`, `community.tsx`, `decks.tsx`, `progress.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `plugins` connect `app/_layout.tsx` to `index.tsx`, `expo`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _247 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useThemeColors` be split into smaller, more focused modules?**
  _Cohesion score 0.060470324748040316 - nodes in this community are weakly interconnected._
- **Should `types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.061142217245240764 - nodes in this community are weakly interconnected._