/**
 * Medidas da barra de abas, num só lugar.
 *
 * A barra é de LARGURA CHEIA, opaca e colada no fundo da tela — o padrão do X e
 * dos apps Android, no lugar da pílula flutuante em vidro que existia aqui
 * antes (aquela era vocabulário do iOS e não lia bem fora dele).
 *
 * Ela segue `position: absolute`, então não ocupa espaço no fluxo e o conteúdo
 * passa POR BAIXO. Por isso as telas roláveis precisam reservar folga no fim —
 * ver `useTabBarInset`, que deriva tudo daqui em vez de repetir números.
 */

/**
 * Tamanho do ícone — o ÚNICO conteúdo de uma aba, já que não há rótulo.
 *
 * 26, não os 22 de quando havia texto embaixo: sem o rótulo dividindo a
 * atenção, o ícone é quem carrega o significado da aba e precisa do peso. É o
 * mesmo movimento que o X faz.
 */
export const TAB_ICON_SIZE = 26;

/**
 * Respiro vertical da barra, acima e abaixo do ícone.
 *
 * 13 mantém a altura útil em 52 — exatamente a de antes, quando eram 22 de
 * ícone mais o bloco do rótulo. Isso é deliberado: a altura é a origem do
 * recuo que TODAS as telas reservam no fim da rolagem (`useTabBarInset`), e
 * mantê-la faz a saída dos rótulos não mexer no layout de nenhuma delas.
 *
 * O inset seguro do aparelho entra POR FORA disto, como `paddingBottom` — é o
 * que faz a barra encostar no fundo sem o ícone cair em cima do indicador de
 * home ou dos botões de navegação do Android.
 */
export const TAB_BAR_PAD_V = 13;

/** Altura ÚTIL da barra, sem o inset seguro. Derivada, nunca chutada. */
export const TAB_BAR_HEIGHT = TAB_ICON_SIZE + TAB_BAR_PAD_V * 2;

/** Respiro entre o fim do conteúdo rolável e o topo da barra. */
export const TAB_CONTENT_GAP = 24;

/**
 * Duração das transições da barra (troca de aba, cor, escala, entrar/sair na
 * rolagem). Uma só constante para que ícone e rótulo cheguem SEMPRE juntos —
 * tempos diferentes fazem a barra parecer desmontada durante a troca.
 */
export const TAB_TRANSITION_MS = 300;
