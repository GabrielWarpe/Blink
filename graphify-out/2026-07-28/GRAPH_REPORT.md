# Graph Report - Blink  (2026-07-28)

## Corpus Check
- 126 files · ~93,870 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 729 nodes · 1792 edges · 68 communities (33 shown, 35 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `87e25121`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useThemeColors
- write/[deckId].tsx
- achievements.ts
- progress.tsx
- backup.ts
- database.ts
- app/_layout.tsx
- expo
- Blink (flashcards app)
- package.json
- include
- decks.tsx
- dependencies
- generate-cards/index.ts
- Blink Adaptive Icon Foreground
- Flashcard Stack Icon Mark
- answer.ts
- Blink App Icon (220x220 SVG)
- Blink App Icon (1024px)
- Blink Logo (Light Theme Variant)
- TagInput.tsx
- grade-answer/index.ts
- metro.config.js
- index.tsx
- Badge.tsx
- expo-asset
- expo-constants
- expo-crypto
- expo-document-picker
- expo-file-system
- useStudySession.ts
- deck/[id].tsx
- @expo-google-fonts/plus-jakarta-sans
- expo-haptics
- expo-image
- expo-image-manipulator
- expo-image-picker
- expo-linear-gradient
- expo-linking
- expo-router
- expo-secure-store
- expo-sharing
- expo-splash-screen
- expo-status-bar
- @expo/vector-icons
- nativewind
- react
- react-native
- @react-native-async-storage/async-storage
- react-native-gesture-handler
- react-native-reanimated
- react-native-safe-area-context
- react-native-screens
- react-native-svg
- react-native-url-polyfill
- Deck
- tailwindcss
- ActivityHeatmap.tsx
- FloatingTabBar.tsx
- expo
- expo-notifications
- @react-native-community/datetimepicker
- react-native-worklets
- settings.tsx

## God Nodes (most connected - your core abstractions)
1. `useThemeColors()` - 92 edges
2. `useAuth()` - 39 edges
3. `expo-router` - 30 edges
4. `useSettings()` - 26 edges
5. `db` - 22 edges
6. `Flashcard` - 20 edges
7. `Deck` - 20 edges
8. `Button()` - 17 edges
9. `useStudySession()` - 17 edges
10. `cardShadow` - 16 edges

## Surprising Connections (you probably didn't know these)
- `ThemeController()` --calls--> `useSettings()`  [EXTRACTED]
  app/_layout.tsx → contexts/SettingsContext.tsx
- `DeckDetailScreen()` --indirect_call--> `sessionAccuracy()`  [INFERRED]
  app/deck/[id].tsx → utils/stats.ts
- `SlideFace()` --calls--> `useThemeColors()`  [EXTRACTED]
  app/onboarding.tsx → hooks/useThemeColors.ts
- `AiGeneratorFormProps` --references--> `Flashcard`  [EXTRACTED]
  components/AiGeneratorForm.tsx → types/index.ts
- `StudyModePickerProps` --references--> `Deck`  [EXTRACTED]
  components/StudyModePicker.tsx → types/index.ts

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

## Communities (68 total, 35 thin omitted)

### Community 0 - "useThemeColors"
Cohesion: 0.07
Nodes (59): ForgotPasswordScreen(), LoginScreen(), mapAuthError(), FieldErrors, RegisterScreen(), AddCardsScreen(), Mode, CardEditorScreen() (+51 more)

### Community 1 - "write/[deckId].tsx"
Cohesion: 0.07
Nodes (56): QuizScreen(), StudySessionScreen(), shuffle(), WriteScreen(), FinishPromptModal(), Props, FlashCard(), FlashCardProps (+48 more)

### Community 2 - "achievements.ts"
Cohesion: 0.09
Nodes (39): AchievementsScreen(), stripEmoji(), LevelsScreen(), Emblem(), EmblemProps, GameIcon(), GameIconProps, GAME_ICON_PATHS (+31 more)

### Community 3 - "progress.tsx"
Cohesion: 0.18
Nodes (13): StreakBadge(), StreakBadgeProps, cardMaturity(), getNewCards(), Maturity, DeckOrigin, Grade, StudySession (+5 more)

### Community 4 - "backup.ts"
Cohesion: 0.13
Nodes (22): APP, applyDeckImport(), BackupResult, buildImportPlan(), CardBundleFile, CardExport, createDeck(), DeckBackupFile (+14 more)

### Community 5 - "database.ts"
Cohesion: 0.06
Nodes (41): PublishToggle(), PublishToggleProps, AuthContext, AuthContextType, AuthProvider(), parseRecoveryLink(), NewDeckInput, GradeErrorCode (+33 more)

### Community 6 - "app/_layout.tsx"
Cohesion: 0.08
Nodes (22): FONT_BASE, FONT_SCALE, LEADING_BASE, RootNavigator(), THEME_MAP, ThemeController(), ThemeVarsView(), OnboardingScreen() (+14 more)

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

### Community 11 - "decks.tsx"
Cohesion: 0.21
Nodes (12): DeckOption, DeckPickerModal(), Props, ConflictResolution, ImportConflictModal(), Props, applyCardImport(), CardImportTarget (+4 more)

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

### Community 16 - "answer.ts"
Cohesion: 0.39
Nodes (8): AnswerCheck, AnswerVerdict, checkAnswer(), keywords(), levenshtein(), normalizeAnswer(), present(), STOPWORDS

### Community 17 - "Blink App Icon (220x220 SVG)"
Cohesion: 0.54
Nodes (8): Blink App Icon (220x220 SVG), Blink Brand Identity, Dark Navy Gradient Backdrop (#14243F to #0C1728, rx=50 squircle), Stacked Flashcard Motif (two offset rounded cards, rear rotated 8deg at 26% opacity), Review Loop Arrow (90deg teal arc + triangular arrowhead), Spaced Repetition Visual Metaphor, Teal Accent Color #15C2B0, Winking Face Mark (single dark eye + teal smile curve)

### Community 18 - "Blink App Icon (1024px)"
Cohesion: 0.62
Nodes (7): Blink Brand Palette (Deep Navy + Teal Accent + Off-White), Flashcard Stack Motif, Card Flip Arrow Glyph, Blink App Icon (1024px), Spaced Repetition Product Identity, Squircle Launcher Geometry (1024 Master Asset), Winking Face Mark (Blink)

### Community 19 - "Blink Logo (Light Theme Variant)"
Cohesion: 0.48
Nodes (7): Blink Logo (Light Theme Variant), Brand Palette (Navy #12203A + Teal #17C1A6), Card Flip Arrow (Spaced Repetition Cue), Flashcard Stack Mascot Mark, Light/Dark Theme Logo Variant Convention, Winking Face Motif, Blink Wordmark

### Community 20 - "TagInput.tsx"
Cohesion: 0.47
Nodes (3): normalizeTag(), TagInput(), TagInputProps

### Community 22 - "metro.config.js"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, { withNativeWind }

### Community 23 - "index.tsx"
Cohesion: 0.18
Nodes (14): CommunityScreen(), DecksScreen(), HomeScreen(), ProfileScreen(), ProgressScreen(), GoalSlider(), GoalSliderProps, Card() (+6 more)

### Community 30 - "useStudySession.ts"
Cohesion: 0.19
Nodes (17): NotificationController(), useActiveTimer(), CardAnswer, useStudySession(), checkAchievements(), reviewCard(), prefetchCardImages(), dateAt() (+9 more)

### Community 31 - "deck/[id].tsx"
Cohesion: 0.18
Nodes (13): accuracyColor(), DeckDetailScreen(), Tab, ModeOption, StudyModePicker(), StudyModePickerProps, useStudyModePicker(), getDueCards() (+5 more)

### Community 55 - "Deck"
Cohesion: 0.29
Nodes (7): DeckAvatar(), DeckAvatarProps, DeckCard(), DeckCardProps, DeckMiniCard(), DeckMiniCardProps, Deck

### Community 60 - "ActivityHeatmap.tsx"
Cohesion: 0.60
Nodes (4): ActivityHeatmap(), ActivityHeatmapProps, alphaHex(), levelFor()

### Community 61 - "FloatingTabBar.tsx"
Cohesion: 0.15
Nodes (14): AnimatedBlurView, AnimatedPressable, barShadow, FloatingTabBar(), GLASS, SHEEN, SLIDE_SPRING, IoniconName (+6 more)

### Community 66 - "settings.tsx"
Cohesion: 0.22
Nodes (11): SettingsScreen(), SettingsRow(), SettingsRowProps, SettingsSection(), SettingsSectionProps, dateToHm(), hmToDate(), TimePickerRow() (+3 more)

## Ambiguous Edges - Review These
- `Blink Product Identity` → `Spaced Repetition Card Review Loop`  [AMBIGUOUS]
  assets/brand/blink_adaptive_foreground.png · relation: conceptually_related_to
- `Blink Wordmark` → `Spaced Repetition Product Metaphor`  [AMBIGUOUS]
  assets/brand/blink_logo_dark_1.png · relation: conceptually_related_to

## Knowledge Gaps
- **187 isolated node(s):** `AnimatedBlurView`, `AnimatedPressable`, `barShadow`, `GLASS`, `SHEEN` (+182 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Blink Product Identity` and `Spaced Repetition Card Review Loop`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Blink Wordmark` and `Spaced Repetition Product Metaphor`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `useThemeColors()` connect `useThemeColors` to `write/[deckId].tsx`, `achievements.ts`, `settings.tsx`, `progress.tsx`, `database.ts`, `app/_layout.tsx`, `decks.tsx`, `Deck`, `index.tsx`, `ActivityHeatmap.tsx`, `FloatingTabBar.tsx`, `deck/[id].tsx`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `expo-router` connect `index.tsx` to `useThemeColors`, `write/[deckId].tsx`, `achievements.ts`, `community/[id].tsx`, `settings.tsx`, `progress.tsx`, `app/_layout.tsx`, `expo`, `database.ts`, `decks.tsx`, `TagInput.tsx`, `FloatingTabBar.tsx`, `deck/[id].tsx`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `plugins` connect `expo` to `index.tsx`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `AnimatedBlurView`, `AnimatedPressable`, `barShadow` to the rest of the system?**
  _187 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useThemeColors` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._