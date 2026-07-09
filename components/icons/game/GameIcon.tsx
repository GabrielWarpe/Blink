import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { GAME_ICON_PATHS, GAME_ICON_VIEWBOX, type GameIconName } from './paths';

interface GameIconProps {
  name: GameIconName;
  /** Lado do quadrado, em px. */
  size: number;
  color: string;
}

/** Desenha uma silhueta monocromática, tingida pela cor recebida. */
export function GameIcon({ name, size, color }: GameIconProps) {
  return (
    <Svg width={size} height={size} viewBox={GAME_ICON_VIEWBOX}>
      <Path d={GAME_ICON_PATHS[name]} fill={color} />
    </Svg>
  );
}

export { type GameIconName };
