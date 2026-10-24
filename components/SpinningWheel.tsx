import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
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
const AMBER = "#fbbf24";
const INK = "#15100b";

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

function truncate(label: string, max: number) {
  return label.length > max ? label.slice(0, max - 1) + "…" : label;
}

/** The static rim: dark disc with a clock-face ring of tick marks. */
function Rim({ size }: { size: number }) {
  const c = size / 2;
  return (
    <Svg width={size} height={size} style={{ position: "absolute" }}>
      <Circle cx={c} cy={c} r={c - 1} fill="#0b0907" stroke="#3a2e20" strokeWidth={1} />
      {Array.from({ length: 60 }).map((_, i) => {
        const big = i % 5 === 0;
        const a = pointAt(i * 6, c * (big ? 0.925 : 0.945), c);
        const b = pointAt(i * 6, c * 0.98, c);
        return (
          <Line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={big ? AMBER : "#6b5a3c"}
            strokeWidth={big ? 2 : 1}
          />
        );
      })}
    </Svg>
  );
}

interface Props {
  items: WheelItem[];
  onSpinStart?: () => void;
  onResult: (index: number) => void;
  /** Shrinks once a winner has landed, so the result can take the stage. */
  size?: number;
  /** Hides the spin hub when the wheel is playing a supporting role. */
  compact?: boolean;
  /** When set, every slice except this one is dimmed. */
  winnerId?: string | null;
}

export default function SpinningWheel({
  items,
  onSpinStart,
  onResult,
  size = DEFAULT_SIZE,
  compact = false,
  winnerId = null,
}: Props) {
  // Slices sit inside the rim, which takes the outer ~15% of the radius.
  const Rw = size * 0.4267;
  const offset = size / 2 - Rw;
  const k = Rw / 128; // scales label metrics against the 300px design
  const hubSize = Math.round(size * 0.26);

  const rot = useSharedValue(0);
  const pulse = useSharedValue(0);
  const [spinning, setSpinning] = useState(false);

  const n = items.length;
  const canSpin = n >= 2 && !spinning;
  const slice = n > 0 ? 360 / n : 0;

  useEffect(() => {
    cancelAnimation(pulse);
    pulse.value = 0;
    if (canSpin && !compact) {
      pulse.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false);
    }
  }, [canSpin, compact, pulse]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.55 }],
  }));

  const finish = (index: number) => {
    setSpinning(false);
    onResult(index);
  };

  const spin = () => {
    if (!canSpin) return;
    setSpinning(true);
    onSpinStart?.();

    const targetIndex = Math.floor(Math.random() * n);
    const centerAngle = targetIndex * slice + slice / 2;
    // Land the target slice's centre under the top pointer, with a little
    // jitter so it doesn't always stop dead-centre: rot ≡ -centerAngle (mod 360).
    const jitter = (Math.random() - 0.5) * slice * 0.5;
    const targetMod = (360 - ((centerAngle + jitter) % 360) + 360) % 360;
    const currentMod = ((rot.value % 360) + 360) % 360;
    let delta = targetMod - currentMod;
    if (delta < 0) delta += 360;
    const finalRot = rot.value + 360 * 5 + delta;

    rot.value = withTiming(
      finalRot,
      { duration: 4000, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(finish)(targetIndex);
      }
    );
  };

  const fontSize = (n > 8 ? 11 : n > 6 ? 12 : 13.5) * k;
  const maxChars = n > 8 ? 8 : 10;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Rim size={size} />

      {/* the slices, spinning inside the static rim */}
      <Pressable
        onPress={spin}
        disabled={!canSpin}
        style={{ position: "absolute", left: offset, top: offset, width: Rw * 2, height: Rw * 2 }}
      >
        <Animated.View style={spinStyle}>
          <Svg width={Rw * 2} height={Rw * 2}>
            {n === 0 && (
              <Circle
                cx={Rw}
                cy={Rw}
                r={Rw - 1}
                fill="#1a140d"
                stroke="#2a2118"
                strokeWidth={2}
                strokeDasharray="6 6"
              />
            )}
            {items.map((item, i) => {
              const start = i * slice;
              const end = (i + 1) * slice;
              const mid = start + slice / 2;
              const dim = winnerId != null && item.id !== winnerId;
              const fill = item.color ?? COLORS[i % COLORS.length];
              // Left half of the wheel is upside-down once it has turned, so
              // those labels are flipped to keep reading outward from the hub.
              const flip = mid > 180;
              const edge = Rw - 12 * k;
              return (
                <G key={item.id}>
                  {n === 1 ? (
                    <Circle cx={Rw} cy={Rw} r={Rw} fill={fill} />
                  ) : (
                    <Path
                      d={wedgePath(start, end, Rw)}
                      fill={fill}
                      stroke="#1e160d"
                      strokeWidth={2.5}
                      opacity={dim ? 0.28 : 1}
                    />
                  )}
                  <G
                    rotation={mid - 90 + (flip ? 180 : 0)}
                    origin={`${Rw}, ${Rw}`}
                    opacity={dim ? 0.4 : 1}
                  >
                    <SvgText
                      x={flip ? Rw - edge : Rw + edge}
                      y={Rw + fontSize * 0.35}
                      fill={item.ink ?? "#18181b"}
                      fontSize={fontSize}
                      fontWeight="bold"
                      textAnchor={flip ? "start" : "end"}
                    >
                      {truncate(item.label, maxChars)}
                    </SvgText>
                  </G>
                </G>
              );
            })}
          </Svg>
        </Animated.View>
      </Pressable>

      {/* fixed pointer at 12 o'clock, pointing down into the wheel */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -4,
          zIndex: 10,
          width: 0,
          height: 0,
          borderLeftWidth: compact ? 11 : 14,
          borderRightWidth: compact ? 11 : 14,
          borderTopWidth: compact ? 20 : 28,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: AMBER,
        }}
      />

      {/* spin hub: a real button, with a ring that pulses while it's ready */}
      {!compact && (
        <View
          pointerEvents="box-none"
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
          className="items-center justify-center"
        >
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                width: hubSize,
                height: hubSize,
                borderRadius: hubSize / 2,
                borderWidth: 2,
                borderColor: AMBER,
              },
              pulseStyle,
            ]}
          />
          <Pressable
            onPress={spin}
            disabled={!canSpin}
            style={{
              width: hubSize,
              height: hubSize,
              borderRadius: hubSize / 2,
              backgroundColor: canSpin ? AMBER : "#3a3226",
              borderWidth: 5,
              borderColor: INK,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={[
                mono,
                {
                  color: canSpin ? "#1a1205" : "#7a6f5d",
                  fontSize: hubSize > 70 ? 13 : 10,
                  fontWeight: "800",
                  letterSpacing: 1.5,
                  textAlign: "center",
                },
              ]}
            >
              {n < 2 ? "ADD\n2+" : spinning ? "···" : "SPIN"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
