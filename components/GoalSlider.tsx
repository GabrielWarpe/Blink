import React, { useRef, useState } from 'react';
import { View, PanResponder } from 'react-native';

const THUMB = 24;
const TRACK = 6;
const HEIGHT = 36;

interface GoalSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Chamado ao vivo enquanto arrasta. */
  onChange: (v: number) => void;
  /** Chamado ao soltar o dedo (persistir aqui). */
  onCommit: (v: number) => void;
  trackColor: string;
  fillColor: string;
  thumbColor: string;
}

/**
 * Slider horizontal simples (sem dependências extras), usado para a meta
 * diária no perfil. Arraste ou toque na trilha para escolher o valor.
 */
export function GoalSlider({
  value,
  min,
  max,
  step = 5,
  onChange,
  onCommit,
  trackColor,
  fillColor,
  thumbColor,
}: GoalSliderProps) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);

  // Refs para o PanResponder (criado uma única vez) enxergar sempre os
  // valores/callbacks atuais.
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;
  const minRef = useRef(min);
  minRef.current = min;
  const maxRef = useRef(max);
  maxRef.current = max;
  const stepRef = useRef(step);
  stepRef.current = step;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: e => {
        const v = valueFromX(e.nativeEvent.locationX);
        valueRef.current = v;
        onChangeRef.current(v);
      },
      onPanResponderMove: e => {
        const v = valueFromX(e.nativeEvent.locationX);
        valueRef.current = v;
        onChangeRef.current(v);
      },
      onPanResponderRelease: () => onCommitRef.current(valueRef.current),
      onPanResponderTerminate: () => onCommitRef.current(valueRef.current),
    }),
  ).current;

  function valueFromX(x: number): number {
    const w = widthRef.current;
    const lo = minRef.current;
    const hi = maxRef.current;
    const st = stepRef.current;
    if (w <= 0) return valueRef.current;
    const raw = lo + (x / w) * (hi - lo);
    const snapped = Math.round(raw / st) * st;
    return Math.min(hi, Math.max(lo, snapped));
  }

  const pct = width > 0 ? (Math.min(max, Math.max(min, value)) - min) / (max - min) : 0;

  return (
    <View
      {...pan.panHandlers}
      onLayout={e => {
        widthRef.current = e.nativeEvent.layout.width;
        setWidth(e.nativeEvent.layout.width);
      }}
      style={{ height: HEIGHT, justifyContent: 'center' }}
    >
      <View
        style={{
          height: TRACK,
          borderRadius: TRACK / 2,
          backgroundColor: trackColor,
          overflow: 'hidden',
        }}
      >
        <View
          pointerEvents="none"
          style={{ width: width * pct, height: '100%', backgroundColor: fillColor }}
        />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: (HEIGHT - THUMB) / 2,
          left: Math.min(Math.max(width * pct - THUMB / 2, 0), Math.max(width - THUMB, 0)),
          width: THUMB,
          height: THUMB,
          borderRadius: THUMB / 2,
          backgroundColor: thumbColor,
        }}
      />
    </View>
  );
}
