# Graph Report - .  (2026-07-25)

## Corpus Check
- 8 files · ~79,559 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 707 nodes · 1749 edges · 60 communities (26 shown, 34 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.75)
- Token cost: 0 input · 32,918 output

## Community Hubs (Navigation)
- Autenticação & Criação de Cards
- Modos de Estudo (Flashcard/Quiz/Escrever)
- Perfil, Conquistas & Níveis
- Início, Detalhe do Deck & Progresso
- Lista de Decks & Importação
- Publicação & Serviços da Comunidade
- Layout Raiz, Tema & Onboarding
- Configuração do App (app.json)
- Visão Geral do Produto (docs)
- Dependências de Build
- Configuração TypeScript
- Tela de Configurações
- Dependências de Runtime
- Edge Function: generate-cards
- Identidade de Marca (ícone adaptativo)
- Logo Blink (variante escura)
- Correção de Respostas (answer.ts)
- Ícone do App (SVG)
- Ícone do App (1024px)
- Logo Blink (variante clara)
- Edição de Deck & Tags
- Edge Function: grade-answer
- Config Metro/NativeWind
- Componente Badge
- Cluster 25
- Cluster 26
- Cluster 27
- Cluster 28
- Cluster 29
- Cluster 30
- Cluster 31
- Cluster 32
- Cluster 33
- Cluster 34
- Cluster 35
- Cluster 36
- Cluster 37
- Cluster 38
- Cluster 39
- Cluster 40
- Cluster 41
- Cluster 42
- Cluster 43
- Cluster 44
- Cluster 45
- Cluster 46
- Cluster 47
- Cluster 48
- Cluster 49
- Cluster 50
- Cluster 51
- Cluster 52
- Cluster 53
- Cluster 54
- Cluster 55
- Cluster 56

## God Nodes (most connected - your core abstractions)
1. `useThemeColors()` - 96 edges
2. `useAuth()` - 44 edges
3. `expo-router` - 29 edges
4. `useSettings()` - 25 edges
5. `db` - 22 edges
6. `Deck` - 21 edges
7. `Flashcard` - 20 edges
8. `Button()` - 17 edges
9. `useStudySession()` - 17 edges
10. `expo` - 15 edges

## Surprising Connections (you probably didn't know these)
- `ThemeController()` --calls--> `useSettings()`  [EXTRACTED]
  app/_layout.tsx → contexts/SettingsContext.tsx
- `SlideFace()` --calls--> `useThemeColors()`  [EXTRACTED]
  app/onboarding.tsx → hooks/useThemeColors.ts
- `graphify knowledge graph workflow` --conceptually_related_to--> `Blink (flashcards app)`  [INFERRED]
  CLAUDE.md → README.md
- `prefetchCardImages()` --references--> `image`  [EXTRACTED]
  services/images.ts → app.json
- `DecksScreen()` --calls--> `useStudyModePicker()`  [EXTRACTED]
  app/(tabs)/decks.tsx → components/StudyModePicker.tsx

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

## Communities (60 total, 34 thin omitted)

### Community 0 - "Autenticação & Criação de Cards"
Cohesion: 0.06
Nodes (66): ForgotPasswordScreen(), LoginScreen(), mapAuthError(), FieldErrors, RegisterScreen(), AddCardsScreen(), Mode, CardEditorScreen() (+58 more)

### Community 1 - "Modos de Estudo (Flashcard/Quiz/Escrever)"
Cohesion: 0.06
Nodes (64): QuizScreen(), StudySessionScreen(), shuffle(), WriteScreen(), AiGeneratorFormProps, FinishPromptModal(), Props, FlashCard() (+56 more)

### Community 2 - "Perfil, Conquistas & Níveis"
Cohesion: 0.08
Nodes (43): AchievementsScreen(), stripEmoji(), LevelsScreen(), ProfileScreen(), Emblem(), EmblemProps, GoalSlider(), GoalSliderProps (+35 more)

### Community 3 - "Início, Detalhe do Deck & Progresso"
Cohesion: 0.08
Nodes (38): accuracyColor(), DeckDetailScreen(), Tab, HomeScreen(), ProgressScreen(), ActivityHeatmap(), ActivityHeatmapProps, alphaHex() (+30 more)

### Community 4 - "Lista de Decks & Importação"
Cohesion: 0.08
Nodes (43): DecksScreen(), DeckOption, DeckPickerModal(), Props, ConflictResolution, ImportConflictModal(), Props, SwipeableDeckRow() (+35 more)

### Community 5 - "Publicação & Serviços da Comunidade"
Cohesion: 0.07
Nodes (31): PublishToggle(), PublishToggleProps, AuthContextType, NewDeckInput, sanitizeInterval(), CommunitySort, downloadDeck(), getCommunityDeck() (+23 more)

### Community 6 - "Layout Raiz, Tema & Onboarding"
Cohesion: 0.06
Nodes (36): plugins, FONT_BASE, FONT_SCALE, LEADING_BASE, NotificationController(), RootNavigator(), THEME_MAP, ThemeController() (+28 more)

### Community 7 - "Configuração do App (app.json)"
Cohesion: 0.07
Nodes (27): backgroundColor, foregroundImage, adaptiveIcon, package, typedRoutes, expo, android, assetBundlePatterns (+19 more)

### Community 8 - "Visão Geral do Produto (docs)"
Cohesion: 0.11
Nodes (25): graphify knowledge graph workflow, ANTHROPIC_API_KEY como segredo de servidor, Blink (flashcards app), Bucket card-images (Storage), Claude (LLM), Comunidade (decks snapshot), Supabase Edge Function (Claude server-side), Expo / React Native stack (+17 more)

### Community 9 - "Dependências de Build"
Cohesion: 0.11
Nodes (17): @babel/core, @expo/ngrok, devDependencies, @babel/core, @expo/ngrok, @types/react, typescript, main (+9 more)

### Community 10 - "Configuração TypeScript"
Cohesion: 0.11
Nodes (17): expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.d.ts, .expo/types/**/*.ts, nativewind-env.d.ts, node_modules, supabase/functions, **/*.ts (+9 more)

### Community 11 - "Tela de Configurações"
Cohesion: 0.21
Nodes (12): SettingsScreen(), SettingsRow(), SettingsRowProps, SettingsSection(), SettingsSectionProps, dateToHm(), hmToDate(), TimePickerRow() (+4 more)

### Community 12 - "Dependências de Runtime"
Cohesion: 0.18
Nodes (11): date-fns, expo, expo-notifications, dependencies, date-fns, expo, expo-notifications, @react-native-community/datetimepicker (+3 more)

### Community 13 - "Edge Function: generate-cards"
Cohesion: 0.18
Nodes (4): ContentType, CORS_HEADERS, GenerateRequest, Mode

### Community 14 - "Identidade de Marca (ícone adaptativo)"
Cohesion: 0.36
Nodes (9): Android Adaptive Icon Foreground Layer, Blink Product Identity, Blink Brand Palette (Navy / Teal / Off-White), Flashcard Stack Motif, Curved Flip Arrow, Blink Adaptive Icon Foreground, Spaced Repetition Card Review Loop, Squircle App Container Shape (+1 more)

### Community 15 - "Logo Blink (variante escura)"
Cohesion: 0.39
Nodes (9): Blink Logo (Dark Variant 1), Blink Wordmark, Dark Theme Brand Palette, Flashcard Stack Icon Mark, Circular Review Loop Arrow, Rounded Rectangle Container Language, Spaced Repetition Product Metaphor, Teal Accent Color (+1 more)

### Community 16 - "Correção de Respostas (answer.ts)"
Cohesion: 0.39
Nodes (8): AnswerCheck, AnswerVerdict, checkAnswer(), keywords(), levenshtein(), normalizeAnswer(), present(), STOPWORDS

### Community 17 - "Ícone do App (SVG)"
Cohesion: 0.54
Nodes (8): Blink App Icon (220x220 SVG), Blink Brand Identity, Dark Navy Gradient Backdrop (#14243F to #0C1728, rx=50 squircle), Stacked Flashcard Motif (two offset rounded cards, rear rotated 8deg at 26% opacity), Review Loop Arrow (90deg teal arc + triangular arrowhead), Spaced Repetition Visual Metaphor, Teal Accent Color #15C2B0, Winking Face Mark (single dark eye + teal smile curve)

### Community 18 - "Ícone do App (1024px)"
Cohesion: 0.62
Nodes (7): Blink Brand Palette (Deep Navy + Teal Accent + Off-White), Flashcard Stack Motif, Card Flip Arrow Glyph, Blink App Icon (1024px), Spaced Repetition Product Identity, Squircle Launcher Geometry (1024 Master Asset), Winking Face Mark (Blink)

### Community 19 - "Logo Blink (variante clara)"
Cohesion: 0.48
Nodes (7): Blink Logo (Light Theme Variant), Brand Palette (Navy #12203A + Teal #17C1A6), Card Flip Arrow (Spaced Repetition Cue), Flashcard Stack Mascot Mark, Light/Dark Theme Logo Variant Convention, Winking Face Motif, Blink Wordmark

### Community 20 - "Edição de Deck & Tags"
Cohesion: 0.47
Nodes (3): normalizeTag(), TagInput(), TagInputProps

### Community 22 - "Config Metro/NativeWind"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, { withNativeWind }

## Ambiguous Edges - Review These
- `Blink Product Identity` → `Spaced Repetition Card Review Loop`  [AMBIGUOUS]
  assets/brand/blink_adaptive_foreground.png · relation: conceptually_related_to
- `Blink Wordmark` → `Spaced Repetition Product Metaphor`  [AMBIGUOUS]
  assets/brand/blink_logo_dark_1.png · relation: conceptually_related_to

## Knowledge Gaps
- **175 isolated node(s):** `name`, `slug`, `version`, `orientation`, `userInterfaceStyle` (+170 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Blink Product Identity` and `Spaced Repetition Card Review Loop`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Blink Wordmark` and `Spaced Repetition Product Metaphor`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `useThemeColors()` connect `Autenticação & Criação de Cards` to `Modos de Estudo (Flashcard/Quiz/Escrever)`, `Perfil, Conquistas & Níveis`, `Início, Detalhe do Deck & Progresso`, `Lista de Decks & Importação`, `Publicação & Serviços da Comunidade`, `Layout Raiz, Tema & Onboarding`, `Tela de Configurações`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `expo-router` connect `Autenticação & Criação de Cards` to `Modos de Estudo (Flashcard/Quiz/Escrever)`, `Perfil, Conquistas & Níveis`, `Início, Detalhe do Deck & Progresso`, `Lista de Decks & Importação`, `Publicação & Serviços da Comunidade`, `Layout Raiz, Tema & Onboarding`, `Tela de Configurações`, `Edição de Deck & Tags`, `Detalhe do Deck da Comunidade`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `plugins` connect `Layout Raiz, Tema & Onboarding` to `Autenticação & Criação de Cards`, `Configuração do App (app.json)`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _175 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Autenticação & Criação de Cards` be split into smaller, more focused modules?**
  _Cohesion score 0.06164089347079038 - nodes in this community are weakly interconnected._