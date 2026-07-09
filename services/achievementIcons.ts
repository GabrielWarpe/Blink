import type { GameIconName } from '@/components/icons/game/paths';
import { LEVEL_TIERS, type TierTone, type TierTreatment } from '@/utils/xp';

/**
 * Visual de cada conquista: silhueta + tom + tratamento.
 *
 * Duas classes de conquista, duas regras:
 *  - **Escadas** (ids `prefixo_número`, ex. `cards_1500`): a família define a
 *    silhueta e o DEGRAU define o peso — o tratamento sobe de `tint` até
 *    `solid-ring` no topo. Assim a galeria mostra hierarquia de verdade.
 *  - **Avulsas** (ex. `christmas`, `phoenix`): silhueta própria, sempre em
 *    `tint`/`primary`. Não são uma escada, então não fingem ter degrau.
 *
 * O degrau é derivado da PRÓPRIA lista de conquistas em tempo de execução, e
 * não de limiares copiados — não há como as duas fontes divergirem.
 */

export interface AchievementVisual {
  icon: GameIconName;
  tone: TierTone;
  treatment: TierTreatment;
}

/** Silhueta de cada família de escada, pelo prefixo do id. */
const LADDER_ICONS: Record<string, GameIconName> = {
  cards: 'book-pile',
  sessions: 'abacus',
  streak: 'flame',
  level: 'ladder',
  decks: 'stack',
  created: 'quill-ink',
  quizmaker: 'help',
  imgcards: 'photo-camera',
  covers: 'book-cover',
  tags: 'price-tag',
  mastered: 'black-belt',
  time: 'hourglass',
  days: 'calendar',
  perfects: 'bullseye',
  sharp: 'razor-blade',
  dayvolume: 'tornado',
  loyal: 'oak',
  night: 'moon',
  dawn: 'sunrise',
};

/** Conquistas avulsas: uma silhueta por conceito. */
const ONE_OFF_ICONS: Record<string, GameIconName> = {
  // Primeiros passos (compartilham a silhueta da família)
  first_deck: 'stack',
  first_session: 'abacus',
  perfect_session: 'bullseye',

  // Horário & calendário
  owl_deep: 'bat',
  before_coffee: 'coffee-cup',
  lunch_break: 'sandwich',
  midnight_sharp: 'alarm-clock',
  after_work: 'beer-stein',
  saturday: 'sofa',
  sunday: 'church',
  full_weekend: 'carousel',
  monday: 'briefcase',
  friday_night: 'party-popper',
  first_of_month: 'pin',
  new_years_eve: 'firework-rocket',
  new_year: 'party-hat',
  christmas: 'pine-tree',
  christmas_eve: 'santa-hat',
  halloween: 'pumpkin',
  valentines: 'cupidon-arrow',
  student_day: 'graduate-cap',
  sao_joao: 'corn',
  april_fools: 'clown',

  // Intensidade & fôlego
  big_session_30: 'weight-lifting-up',
  big_session_50: 'elephant',
  big_session_100: 'dinosaur-rex',
  focus_15: 'meditation',
  focus_30: 'candle-light',
  focus_60: 'mountain-climbing',
  lightning: 'lightning-arc',
  express: 'subway-train',
  double_shift: 'tie',
  triple_shift: 'top-hat',
  five_shift: 'bee',
  sandwich: 'sandwich',

  // Superação & constância
  persistent: 'turtle',
  phoenix: 'burning-embers',
  reborn: 'sprout',
  rock_solid: 'moai',
  double_perfect: 'double-shot',
  hat_trick: 'soccer-ball',
  comeback: 'cycle',
  full_week_coverage: 'compass',
  half_year_months: 'sun-cloud',
  full_year_months: 'ringed-planet',

  // Coleção & criação
  big_deck_50: 'sperm-whale',
  big_deck_100: 'arena',
  five_solid_decks: 'brick-wall',
  ten_solid_decks: 'castle',
  no_deck_behind: 'sheep',
  curator: 'ribbon',
  master_curator: 'ribbon-medal',
  multimedia_deck: 'film-projector',
  quizified_deck: 'on-target',
  deck_tour: 'horse-head',
};

/**
 * Peso visual por faixa do degrau. O cinza (`outline`) NÃO entra aqui: ele
 * significa "bloqueada" na galeria, e usá-lo num degrau baixo faria uma
 * conquista já conquistada parecer não-conquistada. A raridade se lê pelo
 * PESO; o matiz muda uma única vez, no topo. (O último id de cada família
 * ainda recebe `solid-ring` mais abaixo.)
 */
const RANKS: ReadonlyArray<readonly [TierTone, TierTreatment]> = [
  ['primary', 'tint'],
  ['primary', 'ring'],
  ['primary', 'solid'],
  ['tertiary', 'solid'],
];

/** `cards_1500` → { prefix: 'cards', n: 1500 }; null se não for escada. */
function ladderKey(id: string): { prefix: string; n: number } | null {
  const i = id.lastIndexOf('_');
  if (i < 0) return null;
  const prefix = id.slice(0, i);
  const n = Number(id.slice(i + 1));
  if (!Number.isFinite(n) || !(prefix in LADDER_ICONS)) return null;
  return { prefix, n };
}

/**
 * Monta o visual de cada conquista a partir dos ids existentes. As conquistas
 * de patente (`tier_*`) herdam o visual da própria patente.
 */
export function buildAchievementVisuals(
  ids: readonly string[],
): Record<string, AchievementVisual> {
  const out: Record<string, AchievementVisual> = {};

  // 1) Escadas: agrupa por família e ordena pelo limiar.
  const groups = new Map<string, { id: string; n: number }[]>();
  for (const id of ids) {
    const key = ladderKey(id);
    if (!key) continue;
    const list = groups.get(key.prefix) ?? [];
    list.push({ id, n: key.n });
    groups.set(key.prefix, list);
  }
  for (const [prefix, items] of groups) {
    items.sort((a, b) => a.n - b.n);
    const last = items.length - 1;
    items.forEach((item, i) => {
      const q = last === 0 ? 3 : Math.min(3, Math.floor((i / last) * RANKS.length));
      const [tone, treatment] = RANKS[q]!;
      out[item.id] = {
        icon: LADDER_ICONS[prefix]!,
        tone,
        // O último degrau da família é o "topo": ganha o halo.
        treatment: i === last ? 'solid-ring' : treatment,
      };
    });
  }

  // 2) Patentes: espelham o emblema da patente correspondente.
  for (const t of LEVEL_TIERS) {
    out[`tier_${t.name.toLowerCase()}`] = {
      icon: t.icon,
      tone: t.tone,
      treatment: t.treatment,
    };
  }

  // 3) Avulsas: silhueta própria, sem degrau.
  for (const id of ids) {
    if (out[id]) continue;
    const icon = ONE_OFF_ICONS[id];
    if (icon) out[id] = { icon, tone: 'primary', treatment: 'tint' };
  }

  if (__DEV__) {
    const missing = ids.filter(id => !out[id]);
    if (missing.length > 0) {
      console.warn(`[Recall] Conquistas sem ícone: ${missing.join(', ')}`);
    }
  }
  return out;
}
