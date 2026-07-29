# Graph Report - Blink  (2026-07-29)

## Corpus Check
- 136 files · ~102,242 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 821 nodes · 1973 edges · 74 communities (34 shown, 40 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fdb7d7ea`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useThemeColors
- write/[deckId].tsx
- progress.tsx
- FloatingTabBar.tsx
- backup.ts
- services/community.ts
- onboarding.tsx
- expo
- Blink (flashcards app)
- package.json
- include
- answer.ts
- dependencies
- generate-cards/index.ts
- Blink Adaptive Icon Foreground
- community.tsx
- What You Must Do When Invoked
- Blink App Icon (220x220 SVG)
- Blink App Icon (1024px)
- deck/[id].tsx
- Card.tsx
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
- decks.tsx
- settings.tsx
- expo-linking
- expo-router
- graphify reference: commit hook and native CLAUDE.md integration
- expo-sharing
- database.ts
- expo-status-bar
- @expo/vector-icons
- nativewind
- react
- react-native
- @react-native-async-storage/async-storage
- react-native-gesture-handler
- react-native-reanimated
- react-native-screens
- react-native-svg
- react-native-url-polyfill
- graphify reference: incremental update and cluster-only
- tailwindcss
- graphify reference: GitHub clone and cross-repo merge
- GlassSurface.tsx
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
- GoalSlider.tsx
- expo

## God Nodes (most connected - your core abstractions)
1. `useThemeColors()` - 88 edges
2. `useAuth()` - 41 edges
3. `expo-router` - 32 edges
4. `useSettings()` - 23 edges
5. `db` - 21 edges
6. `Flashcard` - 20 edges
7. `Deck` - 18 edges
8. `useStudySession()` - 17 edges
9. `Button()` - 16 edges
10. `expo` - 15 edges

## Surprising Connections (you probably didn't know these)
- `TabsLayout()` --calls--> `useAuth()`  [EXTRACTED]
  app/(tabs)/_layout.tsx → contexts/AuthContext.tsx
- `DeckDetailScreen()` --indirect_call--> `sessionAccuracy()`  [INFERRED]
  app/deck/[id].tsx → utils/stats.ts
- `graphify knowledge graph workflow` --conceptually_related_to--> `Blink (flashcards app)`  [INFERRED]
  CLAUDE.md → README.md
- `RegisterScreen()` --calls--> `useAuth()`  [EXTRACTED]
  app/(auth)/register.tsx → contexts/AuthContext.tsx
- `CommunityScreen()` --calls--> `useGlassEdge()`  [EXTRACTED]
  app/(tabs)/community.tsx → components/ui/GlassSurface.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Pipeline de IA server-side (Claude via Edge Function)** — readme_geracao_com_ia, readme_modo_escrever, readme_edge_function, readme_claude_ia, readme_anthropic_api_key_secret [INFERRED 0.85]
- **Modelo de dados Supabase com RLS** — readme_supabase, readme_row_level_security, readme_schema_sql, readme_tabela_profiles, readme_tabela_flashcards [INFERRED 0.85]
- **Loop de estudo SM-2 e metricas** — readme_repeticao_espacada_sm2, readme_tabela_flashcards, readme_tabela_study_sessions, readme_tabela_card_reviews [INFERRED 0.75]
- **Blink Icon Visual Language** — assets_brand_blink_adaptive_foreground_flashcard_stack, assets_brand_blink_adaptive_foreground_wink_face, assets_brand_blink_adaptive_foreground_flip_arrow, assets_brand_blink_adaptive_foreground_brand_palette, assets_brand_blink_adaptive_foreground_squircle_container [INFERRED 0.85]
- **Icon elements that jointly encode the recall loop (deck, wink, repeat arrow)** — assets_brand_blink_app_icon_flashcard_stack, assets_brand_blink_app_icon_winking_face_mark, assets_brand_blink_app_icon_review_loop_arrow, assets_brand_blink_app_icon_spaced_repetition_metaphor [INFERRED 0.85]
- **Brand visual tokens applied across the icon (teal accent, navy gradient, off-white card fill)** — assets_brand_blink_app_icon_teal_accent_color, assets_brand_blink_app_icon_dark_gradient_backdrop, assets_brand_blink_app_icon_flashcard_stack, assets_brand_blink_app_icon_blink_brand_identity [INFERRED 0.75]

## Communities (74 total, 40 thin omitted)

### Community 0 - "useThemeColors"
Cohesion: 0.06
Nodes (72): ForgotPasswordScreen(), LoginScreen(), mapAuthError(), FieldErrors, RegisterScreen(), AddCardsScreen(), Mode, CardEditorScreen() (+64 more)

### Community 1 - "write/[deckId].tsx"
Cohesion: 0.06
Nodes (71): QuizScreen(), StudySessionScreen(), shuffle(), WriteScreen(), AiGeneratorFormProps, FinishPromptModal(), Props, FlashCard() (+63 more)

### Community 2 - "progress.tsx"
Cohesion: 0.07
Nodes (51): AchievementsScreen(), stripEmoji(), LevelsScreen(), ProgressScreen(), StatCard(), ActivityHeatmap(), ActivityHeatmapProps, alphaHex() (+43 more)

### Community 3 - "FloatingTabBar.tsx"
Cohesion: 0.15
Nodes (16): TabsLayout(), AnimatedBlurView, AnimatedPressable, barShadow, FloatingTabBar(), SLIDE_SPRING, IoniconName, TabBarIcon() (+8 more)

### Community 4 - "backup.ts"
Cohesion: 0.11
Nodes (30): accuracyColor(), DeckDetailScreen(), APP, applyCardImport(), applyDeckImport(), BackupResult, buildImportPlan(), CardBundleFile (+22 more)

### Community 5 - "services/community.ts"
Cohesion: 0.12
Nodes (31): CommunityDeckScreen(), PublishDeckScreen(), PublishToggle(), PublishToggleProps, ReviewComposer(), ReviewComposerProps, CommunitySort, downloadDeck() (+23 more)

### Community 6 - "onboarding.tsx"
Cohesion: 0.12
Nodes (10): Slide, SLIDES, DARK_COLORS, DECK_COLORS, LIGHT_COLORS, ThemePalette, OnboardingContext, OnboardingContextType (+2 more)

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
Cohesion: 0.39
Nodes (8): AnswerCheck, AnswerVerdict, checkAnswer(), keywords(), levenshtein(), normalizeAnswer(), present(), STOPWORDS

### Community 12 - "dependencies"
Cohesion: 0.18
Nodes (11): date-fns, expo-blur, expo-font, @expo-google-fonts/inter, dependencies, date-fns, expo-blur, expo-font (+3 more)

### Community 13 - "generate-cards/index.ts"
Cohesion: 0.18
Nodes (4): ContentType, CORS_HEADERS, GenerateRequest, Mode

### Community 14 - "Blink Adaptive Icon Foreground"
Cohesion: 0.36
Nodes (9): Android Adaptive Icon Foreground Layer, Blink Product Identity, Blink Brand Palette (Navy / Teal / Off-White), Flashcard Stack Motif, Curved Flip Arrow, Blink Adaptive Icon Foreground, Spaced Repetition Card Review Loop, Squircle App Container Shape (+1 more)

### Community 15 - "community.tsx"
Cohesion: 0.20
Nodes (11): COMMUNITY_SORTS, CommunityScreen(), LIST_TITLE, DecksScreen(), HomeScreen(), EnterAnimation(), EnterAnimationProps, useStudyModePicker() (+3 more)

### Community 16 - "What You Must Do When Invoked"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 17 - "Blink App Icon (220x220 SVG)"
Cohesion: 0.54
Nodes (8): Blink App Icon (220x220 SVG), Blink Brand Identity, Dark Navy Gradient Backdrop (#14243F to #0C1728, rx=50 squircle), Stacked Flashcard Motif (two offset rounded cards, rear rotated 8deg at 26% opacity), Review Loop Arrow (90deg teal arc + triangular arrowhead), Spaced Repetition Visual Metaphor, Teal Accent Color #15C2B0, Winking Face Mark (single dark eye + teal smile curve)

### Community 18 - "Blink App Icon (1024px)"
Cohesion: 0.62
Nodes (7): Blink Brand Palette (Deep Navy + Teal Accent + Off-White), Flashcard Stack Motif, Card Flip Arrow Glyph, Blink App Icon (1024px), Spaced Repetition Product Identity, Squircle Launcher Geometry (1024 Master Asset), Winking Face Mark (Blink)

### Community 19 - "deck/[id].tsx"
Cohesion: 0.16
Nodes (11): Tab, DeckAvatar(), DeckAvatarProps, DeckCardProps, DeckMiniCard(), DeckMiniCardProps, ModeOption, StudyModePicker() (+3 more)

### Community 20 - "Card.tsx"
Cohesion: 0.43
Nodes (5): DeckCard(), Card(), CardProps, cardShadow, useGlass()

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

### Community 36 - "decks.tsx"
Cohesion: 0.19
Nodes (11): DECK_SORTS, DeckSort, ConflictResolution, ImportConflictModal(), Props, RevealSearchBar(), RevealSearchBarProps, useRevealSearch() (+3 more)

### Community 37 - "settings.tsx"
Cohesion: 0.06
Nodes (32): plugins, FONT_BASE, FONT_SCALE, LEADING_BASE, THEME_MAP, SettingsScreen(), SettingsRow(), SettingsRowProps (+24 more)

### Community 40 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 42 - "database.ts"
Cohesion: 0.14
Nodes (19): NewDeckInput, useStreak(), db, NewCardInput, NewFlashcardRow, rowsToDeck(), rowToFlashcard(), CardReviewRow (+11 more)

### Community 55 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 61 - "GlassSurface.tsx"
Cohesion: 0.13
Nodes (17): DeckOption, DeckPickerModal(), Props, FilterSheet(), FilterSheetProps, SortOption, AnimatedBlurView, AnimatedGlassFill() (+9 more)

## Ambiguous Edges - Review These
- `Blink Product Identity` → `Spaced Repetition Card Review Loop`  [AMBIGUOUS]
  assets/brand/blink_adaptive_foreground.png · relation: conceptually_related_to

## Knowledge Gaps
- **240 isolated node(s):** `FieldErrors`, `COMMUNITY_SORTS`, `LIST_TITLE`, `DeckSort`, `DECK_SORTS` (+235 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Blink Product Identity` and `Spaced Repetition Card Review Loop`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `expo-router` connect `community.tsx` to `useThemeColors`, `write/[deckId].tsx`, `progress.tsx`, `FloatingTabBar.tsx`, `decks.tsx`, `settings.tsx`, `services/community.ts`, `onboarding.tsx`, `database.ts`, `deck/[id].tsx`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `useThemeColors()` connect `useThemeColors` to `write/[deckId].tsx`, `progress.tsx`, `FloatingTabBar.tsx`, `backup.ts`, `settings.tsx`, `onboarding.tsx`, `decks.tsx`, `community.tsx`, `deck/[id].tsx`, `Card.tsx`, `GlassSurface.tsx`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `plugins` connect `settings.tsx` to `community.tsx`, `expo`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `FieldErrors`, `COMMUNITY_SORTS`, `LIST_TITLE` to the rest of the system?**
  _240 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useThemeColors` be split into smaller, more focused modules?**
  _Cohesion score 0.05998835177635411 - nodes in this community are weakly interconnected._
- **Should `write/[deckId].tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05709507883420927 - nodes in this community are weakly interconnected._