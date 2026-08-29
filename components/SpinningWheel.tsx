import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { mono } from "./receipt";

export type WheelItem = {
  id: string;
  label: string;
  placeId?: number;
  /** Slice fill, normally the station's line colour. */
  color?: string;
  /** Label colour that reads against `color`. */
  ink?: string;
};

const DEFAULT_SIZE = 300;
/** Fallback tints for one-off options that don't belong to a station. */
const COLORS = ["#f59e0b", "#fb923c", "#b45309", "#d97706", "#92400e", "#f97316"];

/** Point on the wheel circle at an angle measured clockwise from the top (12 o'clock). */
function pointAt(angleDeg: number, radius: number, r: number) {
  const t = (angleDeg * Math.PI) / 180;
  return { x: r + radius * Math.sin(t), y: r - radius * Math.cos(t) };
}

/** SVG path for a wedge spanning [startDeg, endDeg] (clockwise from top). */
function wedgePath(startDeg: number, endDeg: number, r: number) {
  const s = pointAt(startDeg, r, r);
  const e = pointAt(endDeg, r, r);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${r} ${r} L ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y} Z`;
}

function truncate(label: string, max = 12) {
  return label.length > max ? label.slice(0, max - 1) + "…" : label;
}

interface Props {
  items: WheelItem[];
  onSpinStart?: () => void;
  onResult: (index: number) => void;
  /** Shrinks once a winner has landed, so the result can take the stage. */
  size?: number;
  /** Hides labels and the hub caption when the wheel is playing a supporting role. */
  compact?: boolean;
}

export default function SpinningWheel({
  items,
  onSpinStart,
  onResult,
  size = DEFAULT_SIZE,
  compact = false,
}: Props) {
  const R = size / 2;
  const LABEL_R = R * 0.6;
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
          borderLeftWidth: compact ? 9 : 12,
          borderRightWidth: compact ? 9 : 12,
          borderTopWidth: compact ? 15 : 20,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: "#fbbf24",
        }}
      />

      <Pressable onPress={spin} disabled={n < 2}>
        <Animated.View style={spinStyle}>
          <Svg width={size} height={size}>
            <G>
              {items.map((item, i) => {
                const start = i * slice;
                const end = (i + 1) * slice;
                const mid = start + slice / 2;
                const lp = pointAt(mid, LABEL_R, R);
                return (
                  <G key={item.id}>
                    <Path
                      d={wedgePath(start, end, R)}
                      // Station line colour when the option is a saved spot,
                      // so the wheel matches the metro screen.
                      fill={item.color ?? COLORS[i % COLORS.length]}
                      stroke="#18181b"
                      strokeWidth={2}
                    />
                    {!compact && (
                      <SvgText
                        x={lp.x}
                        y={lp.y + 4}
                        fill={item.ink ?? "#18181b"}
                        fontSize={13}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {truncate(item.label)}
                      </SvgText>
                    )}
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
        <View
          className="items-center justify-center rounded-full border-2 border-amber-400/60 bg-zinc-950"
          style={{ width: compact ? 44 : 74, height: compact ? 44 : 74 }}
        >
          {!compact && (
            <Text
              style={mono}
              className="text-center text-[9px] font-bold uppercase leading-3 tracking-widest text-amber-400"
            >
              {n < 2 ? "add\n2+" : spinning ? "…" : "tap\nto spin"}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
