import React, { useState } from "react";
import { Pressable, View } from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export type WheelItem = { id: string; label: string; placeId?: number };

const SIZE = 300;
const R = SIZE / 2;
const LABEL_R = R * 0.6;
const COLORS = ["#f59e0b", "#fb923c", "#b45309", "#d97706", "#92400e", "#f97316"];

/** Point on the wheel circle at an angle measured clockwise from the top (12 o'clock). */
function pointAt(angleDeg: number, radius: number) {
  const t = (angleDeg * Math.PI) / 180;
  return { x: R + radius * Math.sin(t), y: R - radius * Math.cos(t) };
}

/** SVG path for a wedge spanning [startDeg, endDeg] (clockwise from top). */
function wedgePath(startDeg: number, endDeg: number) {
  const s = pointAt(startDeg, R);
  const e = pointAt(endDeg, R);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${R} ${R} L ${s.x} ${s.y} A ${R} ${R} 0 ${largeArc} 1 ${e.x} ${e.y} Z`;
}

function truncate(label: string, max = 12) {
  return label.length > max ? label.slice(0, max - 1) + "…" : label;
}

interface Props {
  items: WheelItem[];
  onSpinStart?: () => void;
  onResult: (index: number) => void;
}

export default function SpinningWheel({ items, onSpinStart, onResult }: Props) {
  const rot = useSharedValue(0);
  const [spinning, setSpinning] = useState(false);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));

  const finish = (index: number) => {
    setSpinning(false);
    onResult(index);
  };

  const spin = () => {
    if (spinning || items.length < 2) return;
    setSpinning(true);
    onSpinStart?.();

    const n = items.length;
    const slice = 360 / n;
    const targetIndex = Math.floor(Math.random() * n);
    const centerAngle = targetIndex * slice + slice / 2;
    // Land the target slice's center under the top pointer: rot ≡ -centerAngle (mod 360).
    const targetMod = (360 - (centerAngle % 360)) % 360;
    const currentMod = ((rot.value % 360) + 360) % 360;
    let delta = targetMod - currentMod;
    if (delta < 0) delta += 360;
    const finalRot = rot.value + 360 * 5 + delta;

    rot.value = withTiming(
      finalRot,
      { duration: 3500, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(finish)(targetIndex);
      }
    );
  };

  const n = items.length;
  const slice = n > 0 ? 360 / n : 0;

  return (
    <View className="items-center justify-center">
      {/* fixed pointer at 12 o'clock, pointing down into the wheel */}
      <View
        style={{
          position: "absolute",
          top: -2,
          zIndex: 10,
          width: 0,
          height: 0,
          borderLeftWidth: 12,
          borderRightWidth: 12,
          borderTopWidth: 20,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: "#fef3c7",
        }}
      />

      <Pressable onPress={spin} disabled={n < 2}>
        <Animated.View style={spinStyle}>
          <Svg width={SIZE} height={SIZE}>
            <G>
              {items.map((item, i) => {
                const start = i * slice;
                const end = (i + 1) * slice;
                const mid = start + slice / 2;
                const lp = pointAt(mid, LABEL_R);
                return (
                  <G key={item.id}>
                    <Path
                      d={wedgePath(start, end)}
                      fill={COLORS[i % COLORS.length]}
                      stroke="#18181b"
                      strokeWidth={2}
                    />
                    <SvgText
                      x={lp.x}
                      y={lp.y + 4}
                      fill="#18181b"
                      fontSize={13}
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {truncate(item.label)}
                    </SvgText>
                  </G>
                );
              })}
            </G>
          </Svg>
        </Animated.View>
      </Pressable>

      {/* center hub (does not intercept taps) */}
      <View
        pointerEvents="none"
        style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        className="items-center justify-center"
      >
        <View className="h-12 w-12 rounded-full border-2 border-amber-300 bg-zinc-900" />
      </View>
    </View>
  );
}
