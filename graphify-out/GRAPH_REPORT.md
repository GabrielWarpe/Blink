# Graph Report - Blink  (2026-07-28)

## Corpus Check
- 130 files · ~95,950 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 743 nodes · 1863 edges · 62 communities (27 shown, 35 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `13d748a5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useThemeColors
- write/[deckId].tsx
- achievements.ts
- DeckPickerModal.tsx
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
- Blink App Icon (220x220 SVG)
- Blink App Icon (1024px)
- Blink Logo (Light Theme Variant)
- grade-answer/index.ts
- metro.config.js
- useGlassEdge
- Badge.tsx
- expo-asset
- expo-constants
- expo-crypto
- expo-document-picker
- expo-file-system
- progress.tsx
- Card.tsx
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
- tailwindcss
- index.tsx
- expo
- expo-notifications
- @react-native-community/datetimepicker
- react-native-worklets

## God Nodes (most connected - your core abstractions)
1. `useThemeColors()` - 88 edges
2. `useAuth()` - 38 edges
3. `expo-router` - 30 edges
4. `useSettings()` - 25 edges
5. `db` - 22 edges
6. `Flashcard` - 20 edges
7. `Deck` - 19 edges
8. `Button()` - 18 edges
9. `useStudySession()` - 17 edges
10. `cardShadow` - 16 edges

## Surprising Connections (you probably didn't know these)
- `ThemeController()` --calls--> `useSettings()`  [EXTRACTED]
  app/_layout.tsx → contexts/SettingsContext.tsx
- `SlideFace()` --calls--> `useThemeColors()`  [EXTRACTED]
  app/onboarding.tsx → hooks/useThemeColors.ts
- `exportDecks()` --indirect_call--> `canExport()`  [INFERRED]
  services/backup.ts → utils/community.ts
- `graphify knowledge graph workflow` --conceptually_related_to--> `Blink (flashcards app)`  [INFERRED]
  CLAUDE.md → README.md
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
- **Blink Dark-Variant Brand Identity System** — assets_brand_blink_logo_dark_1_blink_wordmark, assets_brand_blink_logo_dark_1_flashcard_stack_icon, assets_brand_blink_logo_dark_1_dark_theme_palette, assets_brand_blink_logo_dark_1_teal_accent_color, assets_brand_blink_logo_dark_1_rounded_container_shape [INFERRED 0.85]
- **Recall/Review Visual Metaphor Cluster** — assets_brand_blink_logo_dark_1_winking_face_motif, assets_brand_blink_logo_dark_1_review_loop_arrow, assets_brand_blink_logo_dark_1_flashcard_stack_icon, assets_brand_blink_logo_dark_1_spaced_repetition_metaphor [INFERRED 0.85]
- **Blink Brand Identity System (mark + wordmark + palette + theme variant)** — assets_brand_blink_logo_light, assets_brand_blink_logo_light_wordmark, assets_brand_blink_logo_light_flashcard_mascot, assets_brand_blink_logo_light_brand_palette, assets_brand_blink_logo_light_theme_variant_asset_pair [INFERRED 0.85]
- **Flashcard Recall Visual Metaphor (card stack, flip arrow, wink)** — assets_brand_blink_logo_light_flashcard_mascot, assets_brand_blink_logo_light_card_flip_arrow, assets_brand_blink_logo_light_winking_face_motif [INFERRED 0.85]

## Communities (62 total, 35 thin omitted)

### Community 0 - "useThemeColors"
Cohesion: 0.09
Nodes (52): ForgotPasswordScreen(), LoginScreen(), mapAuthError(), FieldErrors, RegisterScreen(), AddCardsScreen(), Mode, CardEditorScreen() (+44 more)

### Community 1 - "write/[deckId].tsx"
Cohesion: 0.06
Nodes (67): QuizScreen(), StudySessionScreen(), shuffle(), WriteScreen(), AiGeneratorFormProps, FinishPromptModal(), FlashCard(), FlashCardProps (+59 more)

### Community 2 - "achievements.ts"
Cohesion: 0.10
Nodes (35): AchievementsScreen(), stripEmoji(), LevelsScreen(), Emblem(), EmblemProps, GameIcon(), GameIconProps, GAME_ICON_PATHS (+27 more)

### Community 3 - "DeckPickerModal.tsx"
Cohesion: 0.40
Nodes (4): DeckOption, DeckPickerModal(), Props, CardImportTarget

### Community 4 - "backup.ts"
Cohesion: 0.14
Nodes (23): APP, applyDeckImport(), BackupResult, buildImportPlan(), CardBundleFile, CardExport, createDeck(), DeckBackupFile (+15 more)

### Community 5 - "database.ts"
Cohesion: 0.06
Nodes (49): PublishToggle(), PublishToggleProps, StarRating(), StarRatingProps, AuthContext, AuthContextType, AuthProvider(), parseRecoveryLink() (+41 more)

### Community 6 - "app/_layout.tsx"
Cohesion: 0.08
Nodes (22): FONT_BASE, FONT_SCALE, LEADING_BASE, RootNavigator(), THEME_MAP, ThemeController(), ThemeVarsView(), OnboardingScreen() (+14 more)

### Community 7 - "expo"
Cohesion: 0.05
Nodes (39): backgroundColor, foregroundImage, adaptiveIcon, package, typedRoutes, expo, android, assetBundlePatterns (+31 more)

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
Cohesion: 0.13
Nodes (13): DecksScreen(), ConflictResolution, ImportConflictModal(), Props, SwipeableDeckRow(), SwipeableDeckRowProps, applyCardImport(), BackupError (+5 more)

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

### Community 17 - "Blink App Icon (220x220 SVG)"
Cohesion: 0.54
Nodes (8): Blink App Icon (220x220 SVG), Blink Brand Identity, Dark Navy Gradient Backdrop (#14243F to #0C1728, rx=50 squircle), Stacked Flashcard Motif (two offset rounded cards, rear rotated 8deg at 26% opacity), Review Loop Arrow (90deg teal arc + triangular arrowhead), Spaced Repetition Visual Metaphor, Teal Accent Color #15C2B0, Winking Face Mark (single dark eye + teal smile curve)

### Community 18 - "Blink App Icon (1024px)"
Cohesion: 0.62
Nodes (7): Blink Brand Palette (Deep Navy + Teal Accent + Off-White), Flashcard Stack Motif, Card Flip Arrow Glyph, Blink App Icon (1024px), Spaced Repetition Product Identity, Squircle Launcher Geometry (1024 Master Asset), Winking Face Mark (Blink)

### Community 19 - "Blink Logo (Light Theme Variant)"
Cohesion: 0.48
Nodes (7): Blink Logo (Light Theme Variant), Brand Palette (Navy #12203A + Teal #17C1A6), Card Flip Arrow (Spaced Repetition Cue), Flashcard Stack Mascot Mark, Light/Dark Theme Logo Variant Convention, Winking Face Motif, Blink Wordmark

### Community 22 - "metro.config.js"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, { withNativeWind }

### Community 23 - "useGlassEdge"
Cohesion: 0.25
Nodes (8): CommunityScreen(), ProfileScreen(), ProgressScreen(), StatCard(), SettingsSection(), SettingsSectionProps, GlassSheen(), useGlassEdge()

### Community 30 - "progress.tsx"
Cohesion: 0.08
Nodes (45): accuracyColor(), DeckDetailScreen(), Tab, NotificationController(), ActivityHeatmap(), ActivityHeatmapProps, alphaHex(), levelFor() (+37 more)

### Community 31 - "Card.tsx"
Cohesion: 0.16
Nodes (16): DeckCard(), DeckCardProps, Props, ModeOption, StudyModePicker(), StudyModePickerProps, CardProps, cardShadow (+8 more)

### Community 61 - "index.tsx"
Cohesion: 0.07
Nodes (32): HomeScreen(), AnimatedBlurView, AnimatedPressable, barShadow, FloatingTabBar(), GLASS, SHEEN, SLIDE_SPRING (+24 more)

## Ambiguous Edges - Review These
- `Blink Product Identity` → `Spaced Repetition Card Review Loop`  [AMBIGUOUS]
  assets/brand/blink_adaptive_foreground.png · relation: conceptually_related_to
- `Blink Wordmark` → `Spaced Repetition Product Metaphor`  [AMBIGUOUS]
  assets/brand/blink_logo_dark_1.png · relation: conceptually_related_to

## Knowledge Gaps
- **192 isolated node(s):** `DeckCardProps`, `DeckCoverPickerProps`, `DeckOption`, `Props`, `Props` (+187 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Blink Product Identity` and `Spaced Repetition Card Review Loop`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Blink Wordmark` and `Spaced Repetition Product Metaphor`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `useThemeColors()` connect `useThemeColors` to `write/[deckId].tsx`, `achievements.ts`, `DeckPickerModal.tsx`, `database.ts`, `app/_layout.tsx`, `expo`, `decks.tsx`, `index.tsx`, `progress.tsx`, `Card.tsx`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `expo-router` connect `index.tsx` to `useThemeColors`, `write/[deckId].tsx`, `achievements.ts`, `database.ts`, `app/_layout.tsx`, `expo`, `decks.tsx`, `progress.tsx`, `Card.tsx`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `plugins` connect `expo` to `index.tsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `DeckCardProps`, `DeckCoverPickerProps`, `DeckOption` to the rest of the system?**
  _192 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useThemeColors` be split into smaller, more focused modules?**
  _Cohesion score 0.0909456740442656 - nodes in this community are weakly interconnected._