# Graph Report - Recall  (2026-07-29)

## Corpus Check
- 135 files · ~101,547 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 833 nodes · 1940 edges · 78 communities (38 shown, 40 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `80fe6faf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useThemeColors
- types/index.ts
- achievements.ts
- FloatingTabBar.tsx
- decks.tsx
- database.ts
- app/_layout.tsx
- expo
- Blink (flashcards app)
- package.json
- include
- answer.ts
- dependencies
- generate-cards/index.ts
- Blink Adaptive Icon Foreground
- Flashcard Stack Icon Mark
- TagInput.tsx
- Blink App Icon (220x220 SVG)
- Blink App Icon (1024px)
- Blink Logo (Light Theme Variant)
- settings.tsx
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
- expo-image-picker
- Deck
- expo-linking
- expo-router
- expo-secure-store
- expo-sharing
- date-fns
- expo-status-bar
- @expo/vector-icons
- nativewind
- react
- react-native
- @react-native-async-storage/async-storage
- react-native-gesture-handler
- react-native-reanimated
- achievements.ts
- react-native-screens
- react-native-svg
- react-native-url-polyfill
- graphify reference: incremental update and cluster-only
- tailwindcss
- graphify reference: GitHub clone and cross-repo merge
- progress.tsx
- notifications.ts
- expo-notifications
- @react-native-community/datetimepicker
- react-native-worklets
- graphify reference: transcribe video and audio
- CLAUDE.md
- extraction-spec.md
- supabase.ts
- expo-font
- expo-secure-store
- expo-linear-gradient
- expo-notifications
- expo-splash-screen
- react-native-safe-area-context
- GoalSlider.tsx
- expo

## God Nodes (most connected - your core abstractions)
1. `useThemeColors()` - 96 edges
2. `useAuth()` - 39 edges
3. `expo-router` - 31 edges
4. `useSettings()` - 23 edges
5. `db` - 21 edges
6. `Flashcard` - 20 edges
7. `Deck` - 19 edges
8. `useStudySession()` - 17 edges
9. `Button()` - 16 edges
10. `expo` - 15 edges

## Surprising Connections (you probably didn't know these)
- `TabsLayout()` --calls--> `useAuth()`  [EXTRACTED]
  app/(tabs)/_layout.tsx → contexts/AuthContext.tsx
- `DeckDetailScreen()` --indirect_call--> `sessionAccuracy()`  [INFERRED]
  app/deck/[id].tsx → utils/stats.ts
- `SlideFace()` --calls--> `useThemeColors()`  [EXTRACTED]
  app/onboarding.tsx → hooks/useThemeColors.ts
- `ImportConflictModal()` --calls--> `useThemeColors()`  [EXTRACTED]
  components/ImportConflictModal.tsx → hooks/useThemeColors.ts
- `graphify knowledge graph workflow` --conceptually_related_to--> `Blink (flashcards app)`  [INFERRED]
  CLAUDE.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Pipeline de IA server-side (Claude via Edge Function)** — readme_geracao_com_ia, readme_modo_escrever, readme_edge_function, readme_claude_ia, readme_anthropic_api_key_secret [INFERRED 0.85]
- **Modelo de dados Supabase com RLS** — readme_supabase, readme_row_level_security, readme_schema_sql, readme_tabela_profiles, readme_tabela_flashcards [INFERRED 0.85]
- **Loop de estudo SM-2 e metricas** — readme_repeticao_espacada_sm2, readme_tabela_flashcards, readme_tabela_study_sessions, readme_tabela_card_reviews [INFERRED 0.75]
- **Blink Icon Visual Language** — assets_brand_blink_adaptive_foreground_flashcard_stack, assets_brand_blink_adaptive_foreground_wink_face, assets_brand_blink_adaptive_foreground_flip_arrow, assets_brand_blink_adaptive_foreground_brand_palette, assets_brand_blink_adaptive_foreground_squircle_container [INFERRED 0.85]
- **Icon elements that jointly encode the recall loop (deck, wink, repeat arrow)** — assets_brand_blink_app_icon_flashcard_stack, assets_brand_blink_app_icon_winking_face_mark, assets_brand_blink_app_icon_review_loop_arrow, assets_brand_blink_app_icon_spaced_repetition_metaphor [INFERRED 0.85]
- **Brand visual tokens applied across the icon (teal accent, navy gradient, off-white card fill)** — assets_brand_blink_app_icon_teal_accent_color, assets_brand_blink_app_icon_dark_gradient_backdrop, assets_brand_blink_app_icon_flashcard_stack, assets_brand_blink_app_icon_blink_brand_identity [INFERRED 0.75]
- **Blink Dark-Variant Brand Identity System** — assets_brand_blink_logo_dark_1_blink_wordmark, assets_brand_blink_logo_dark_1_flashcard_stack_icon, assets_brand_blink_logo_dark_1_dark_theme_palette, assets_brand_blink_logo_dark_1_teal_accent_color, assets_brand_blink_logo_dark_1_rounded_container_shape [INFERRED 0.85]
- **Recall/Review Visual Metaphor Cluster** — assets_brand_blink_logo_dark_1_winking_face_motif, assets_brand_blink_logo_dark_1_review_loop_arrow, assets_brand_blink_logo_dark_1_flashcard_stack_icon, assets_brand_blink_logo_dark_1_spaced_repetition_metaphor [INFERRED 0.85]
- **Blink Brand Identity System (mark + wordmark + palette + theme variant)** — assets_brand_blink_logo_light, assets_brand_blink_logo_light_wordmark, assets_brand_blink_logo_light_flashcard_mascot, assets_brand_blink_logo_light_brand_palette, assets_brand_blink_logo_light_theme_variant_asset_pair [INFERRED 0.85]
- **Flashcard Recall Visual Metaphor (card stack, flip arrow, wink)** — assets_brand_blink_logo_light_flashcard_mascot, assets_brand_blink_logo_light_card_flip_arrow, assets_brand_blink_logo_light_winking_face_motif [INFERRED 0.85]

## Communities (78 total, 40 thin omitted)

### Community 0 - "useThemeColors"
Cohesion: 0.06
Nodes (61): ForgotPasswordScreen(), LoginScreen(), mapAuthError(), FieldErrors, RegisterScreen(), AddCardsScreen(), Mode, CardEditorScreen() (+53 more)

### Community 1 - "types/index.ts"
Cohesion: 0.08
Nodes (53): OnboardingScreen(), QuizScreen(), StudySessionScreen(), shuffle(), WriteScreen(), AiGeneratorFormProps, FinishPromptModal(), FlashCard() (+45 more)

### Community 2 - "achievements.ts"
Cohesion: 0.17
Nodes (21): LevelsScreen(), Emblem(), EmblemProps, GameIcon(), GameIconProps, GAME_ICON_PATHS, GameIconName, AchievementVisual (+13 more)

### Community 3 - "FloatingTabBar.tsx"
Cohesion: 0.09
Nodes (26): TabsLayout(), AnimatedBlurView, AnimatedPressable, barShadow, GLASS, SHEEN, SLIDE_SPRING, IoniconName (+18 more)

### Community 4 - "decks.tsx"
Cohesion: 0.08
Nodes (37): accuracyColor(), DeckDetailScreen(), Tab, ConflictResolution, ImportConflictModal(), Props, getDueCards(), APP (+29 more)

### Community 5 - "database.ts"
Cohesion: 0.11
Nodes (36): CommunityDeckScreen(), PublishDeckScreen(), EditDeckScreen(), PublishToggle(), PublishToggleProps, ReviewComposer(), ReviewComposerProps, normalizeTag() (+28 more)

### Community 6 - "app/_layout.tsx"
Cohesion: 0.19
Nodes (10): AuthContext, AuthContextType, AuthProvider(), parseRecoveryLink(), OnboardingContext, OnboardingContextType, OnboardingProvider(), useOnboarding() (+2 more)

### Community 7 - "expo"
Cohesion: 0.04
Nodes (38): backgroundColor, foregroundImage, adaptiveIcon, package, typedRoutes, expo, android, assetBundlePatterns (+30 more)

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

### Community 15 - "Flashcard Stack Icon Mark"
Cohesion: 0.39
Nodes (9): Blink Logo (Dark Variant 1), Blink Wordmark, Dark Theme Brand Palette, Flashcard Stack Icon Mark, Circular Review Loop Arrow, Rounded Rectangle Container Language, Spaced Repetition Product Metaphor, Teal Accent Color (+1 more)

### Community 16 - "TagInput.tsx"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 17 - "Blink App Icon (220x220 SVG)"
Cohesion: 0.54
Nodes (8): Blink App Icon (220x220 SVG), Blink Brand Identity, Dark Navy Gradient Backdrop (#14243F to #0C1728, rx=50 squircle), Stacked Flashcard Motif (two offset rounded cards, rear rotated 8deg at 26% opacity), Review Loop Arrow (90deg teal arc + triangular arrowhead), Spaced Repetition Visual Metaphor, Teal Accent Color #15C2B0, Winking Face Mark (single dark eye + teal smile curve)

### Community 18 - "Blink App Icon (1024px)"
Cohesion: 0.62
Nodes (7): Blink Brand Palette (Deep Navy + Teal Accent + Off-White), Flashcard Stack Motif, Card Flip Arrow Glyph, Blink App Icon (1024px), Spaced Repetition Product Identity, Squircle Launcher Geometry (1024 Master Asset), Winking Face Mark (Blink)

### Community 19 - "Blink Logo (Light Theme Variant)"
Cohesion: 0.48
Nodes (7): Blink Logo (Light Theme Variant), Brand Palette (Navy #12203A + Teal #17C1A6), Card Flip Arrow (Spaced Repetition Cue), Flashcard Stack Mascot Mark, Light/Dark Theme Logo Variant Convention, Winking Face Motif, Blink Wordmark

### Community 20 - "settings.tsx"
Cohesion: 0.20
Nodes (11): useActiveTimer(), CardAnswer, AchievementStats, Maturity, reviewCard(), DeckOrigin, Grade, StudyMode (+3 more)

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

### Community 36 - "expo-image-picker"
Cohesion: 0.18
Nodes (14): COMMUNITY_SORTS, CommunityScreen(), LIST_TITLE, DECK_SORTS, DeckSort, DecksScreen(), FilterSheet(), FilterSheetProps (+6 more)

### Community 37 - "Deck"
Cohesion: 0.17
Nodes (13): SettingsScreen(), SettingsRow(), SettingsRowProps, dateToHm(), hmToDate(), TimePickerRow(), TimePickerRowProps, Toggle() (+5 more)

### Community 40 - "expo-secure-store"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 42 - "date-fns"
Cohesion: 0.18
Nodes (13): NewDeckInput, sanitizeInterval(), NewCardInput, NewFlashcardRow, rowsToDeck(), rowToFlashcard(), CardReviewRow, CardType (+5 more)

### Community 51 - "achievements.ts"
Cohesion: 0.23
Nodes (11): AchievementsScreen(), stripEmoji(), buildAchievementVisuals(), accuracyOf(), Achievement, buildAchievementStats(), closestLockedAchievement(), getUnlocked() (+3 more)

### Community 55 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 61 - "progress.tsx"
Cohesion: 0.07
Nodes (48): HomeScreen(), ProgressScreen(), StatCard(), ActivityHeatmap(), ActivityHeatmapProps, alphaHex(), levelFor(), DeckAvatar() (+40 more)

### Community 62 - "notifications.ts"
Cohesion: 0.31
Nodes (10): checkAchievements(), dateAt(), dueCountAt(), ensureAndroidChannel(), fireNotification(), fireStreakNotification(), parseTime(), ReminderConfig (+2 more)

### Community 63 - "expo-notifications"
Cohesion: 0.62
Nodes (5): useStreak(), addDays(), computeLongestStreak(), computeStreak(), localDay()

### Community 69 - "supabase.ts"
Cohesion: 0.33
Nodes (5): GradeErrorCode, GradeParams, GradeResult, ExpoSecureStoreAdapter, supabase

## Ambiguous Edges - Review These
- `Blink Product Identity` → `Spaced Repetition Card Review Loop`  [AMBIGUOUS]
  assets/brand/blink_adaptive_foreground.png · relation: conceptually_related_to
- `Blink Wordmark` → `Spaced Repetition Product Metaphor`  [AMBIGUOUS]
  assets/brand/blink_logo_dark_1.png · relation: conceptually_related_to

## Knowledge Gaps
- **239 isolated node(s):** `COMMUNITY_SORTS`, `LIST_TITLE`, `DeckSort`, `DECK_SORTS`, `THEME_MAP` (+234 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Blink Product Identity` and `Spaced Repetition Card Review Loop`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Blink Wordmark` and `Spaced Repetition Product Metaphor`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `expo-router` connect `useThemeColors` to `types/index.ts`, `achievements.ts`, `FloatingTabBar.tsx`, `decks.tsx`, `database.ts`, `Deck`, `expo`, `expo-image-picker`, `date-fns`, `achievements.ts`, `progress.tsx`, `expo-notifications`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `useThemeColors()` connect `types/index.ts` to `useThemeColors`, `achievements.ts`, `FloatingTabBar.tsx`, `decks.tsx`, `database.ts`, `Deck`, `achievements.ts`, `progress.tsx`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `plugins` connect `expo` to `useThemeColors`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `COMMUNITY_SORTS`, `LIST_TITLE`, `DeckSort` to the rest of the system?**
  _239 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useThemeColors` be split into smaller, more focused modules?**
  _Cohesion score 0.05811965811965812 - nodes in this community are weakly interconnected._