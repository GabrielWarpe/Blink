import React from 'react';
import { Switch, type SwitchProps } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

type ToggleProps = Omit<
  SwitchProps,
  'trackColor' | 'thumbColor' | 'ios_backgroundColor'
>;

/**
 * Interruptor do app — o `Switch` do RN com UMA paleta só.
 *
 * As cores não são livres porque o destaque é monocromático (cinza claro no
 * escuro): trilho e botão claros ao mesmo tempo viram uma pastilha branca
 * chapada, sem leitura de ligado/desligado. Ligado = botão escuro sobre trilho
 * de destaque; desligado = botão cinza sobre trilho neutro.
 */
export function Toggle({ value, ...props }: ToggleProps) {
  const colors = useThemeColors();

  return (
    <Switch
      value={value}
      trackColor={{
        false: colors.surfaceContainerHighest,
        true: colors.primaryContainer,
      }}
      thumbColor={value === true ? colors.onPrimaryContainer : colors.outline}
      ios_backgroundColor={colors.surfaceContainerHighest}
      {...props}
    />
  );
}
