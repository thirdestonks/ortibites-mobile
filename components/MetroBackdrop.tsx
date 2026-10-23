import { memo, useEffect, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop, Text as SvgText } from "react-native-svg";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import {
  BOX_H,
  BOX_W,
  INTERCHANGES,
  LABELS,
  METRO_LINES,
  STATIONS,
  type MetroLine,
} from "./metroBackdropData";

/** "Night Service": the warm near-black the map is drawn on. Exported so screens can match it. */
export const NIGHT = "#2e2519"; // the Night Service map's land colour
const ROAD = "#0a0803"; // and its near-black roads
const STOP = "#fff4d6"; // the white of a stop, warmed a touch
const CREAM = "#fff4d6";

const LINE_W = 5;
const TRAIL = 6; // dots behind the comet's head
const GAP = 0.016; // how far apart the trail dots sit, as a share of the line
const PAUSE_MS = 1400; // rest between passes
const SAMPLE_T = Array.from({ length: 48 }, (_, i) => i / 47);

/**
 * The still part of the map: thin lines, white stops, ringed interchanges and a
 * few meal names. Drawn once and never touched again, so it costs nothing per
 * frame (the moving light is separate, below).
 */
const StaticMap = memo(function StaticMap() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${BOX_W} ${BOX_H}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <Defs>
        <RadialGradient id="warm" cx={330} cy={150} r={280} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#f5a31a" stopOpacity={0.16} />
          <Stop offset="1" stopColor="#f5a31a" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="cool" cx={40} cy={770} r={280} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#5ba4d9" stopOpacity={0.14} />
          <Stop offset="1" stopColor="#5ba4d9" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={BOX_W} height={BOX_H} fill="url(#warm)" />
      <Rect x={0} y={0} width={BOX_W} height={BOX_H} fill="url(#cool)" />

      {/* dark road casing under each line, like the roads on the night map */}
      {METRO_LINES.map((l) => (
        <Path
          key={`case-${l.id}`}
          d={l.d}
          stroke={ROAD}
          strokeWidth={LINE_W + 6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ))}

      {METRO_LINES.map((l) => (
        <Path
          key={l.id}
          d={l.d}
          stroke={l.color}
          strokeOpacity={0.9}
          strokeWidth={LINE_W}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ))}

      {STATIONS.map((s) => (
        <Circle key={`${s.x}-${s.y}`} cx={s.x} cy={s.y} r={5.5} fill={STOP} stroke={NIGHT} strokeWidth={2.4} />
      ))}

      {INTERCHANGES.map((s) => (
        <Circle key={`${s.x}-${s.y}`} cx={s.x} cy={s.y} r={7.5} fill={STOP} stroke={NIGHT} strokeWidth={2.4} />
      ))}
      {INTERCHANGES.map((s) => (
        <Circle key={`in-${s.x}-${s.y}`} cx={s.x} cy={s.y} r={3} fill={NIGHT} />
      ))}

      {LABELS.map((l) => (
        <SvgText
          key={l.text}
          x={l.x}
          y={l.y}
          fontSize={9}
          fill={CREAM}
          fillOpacity={0.45}
          textAnchor={l.anchor}
        >
          {l.text}
        </SvgText>
      ))}
    </Svg>
  );
});

type Placement = { scale: number; ox: number; oy: number };

/**
 * One dot of a comet. Its position is read from the line's sampled points on
 * the UI thread, so moving it is a plain transform and never redraws the map.
 */
function CometDot({
  line,
  progress,
  k,
  size,
  placement,
  kind,
}: {
  line: MetroLine;
  progress: SharedValue<number>;
  k: number; // 0 = head, 1.. = trail
  size: number;
  placement: Placement;
  kind: "halo" | "head" | "trail";
}) {
  const { scale, ox, oy } = placement;
  const { xs, ys } = line;
  const half = size / 2;
  const fade = 1 - k / (TRAIL + 1);

  const style = useAnimatedStyle(() => {
    const q = progress.value - k * GAP;
    const c = Math.min(1, Math.max(0, q));
    const x = interpolate(c, SAMPLE_T, xs) * scale + ox;
    const y = interpolate(c, SAMPLE_T, ys) * scale + oy;
    return {
      opacity:
        q <= 0 || q >= 1 ? 0 : kind === "trail" ? fade * 0.75 : kind === "halo" ? 0.4 : 1,
      transform: [{ translateX: x - half }, { translateY: y - half }],
    };
  });

  // Static looks per kind, picked up front so the style array never holds a
  // falsy entry (Reanimated inspects every entry of an animated style array).
  const look =
    kind === "head"
      ? { backgroundColor: "#ffffff", borderWidth: 2.5, borderColor: line.color }
      : kind === "trail"
      ? { backgroundColor: CREAM }
      : { backgroundColor: line.color };

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: 0,
          top: 0,
          width: size,
          height: size,
          borderRadius: half,
        },
        look,
        style,
      ]}
    />
  );
}

/** A light that travels the whole line, rests, then goes again. */
function Comet({ line, placement }: { line: MetroLine; placement: Placement }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      line.delay,
      withRepeat(
        withSequence(
          // runs a little past 1 so the trail leaves the line after the head
          withTiming(1 + TRAIL * GAP, { duration: line.duration, easing: Easing.linear }),
          withDelay(PAUSE_MS, withTiming(0, { duration: 0 }))
        ),
        -1
      )
    );
  }, [progress, line.delay, line.duration]);

  return (
    <>
      {Array.from({ length: TRAIL }).map((_, i) => (
        <CometDot
          key={`t${i}`}
          line={line}
          progress={progress}
          k={i + 1}
          size={Math.max(2.5, 8 - i)}
          placement={placement}
          kind="trail"
        />
      ))}
      <CometDot line={line} progress={progress} k={0} size={30} placement={placement} kind="halo" />
      <CometDot line={line} progress={progress} k={0} size={11} placement={placement} kind="head" />
    </>
  );
}

/**
 * Light transit-map background for the login screen, in the spirit of flat
 * Vignelli-style maps: cream paper, thin orthogonal lines with rounded
 * corners, white stops. The lines stay still; lights run along them.
 * Decorative only, never takes touches.
 */
function MetroBackdrop() {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev && prev.w === width && prev.h === height ? prev : { w: width, h: height }));
  };

  // Same "slice" fit the Svg uses (cover the box, centre it), so the comets
  // land exactly on the drawn lines.
  const placement: Placement | null = size
    ? (() => {
        const scale = Math.max(size.w / BOX_W, size.h / BOX_H);
        return { scale, ox: (size.w - BOX_W * scale) / 2, oy: (size.h - BOX_H * scale) / 2 };
      })()
    : null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout}>
      <StaticMap />
      {placement &&
        METRO_LINES.map((l) => <Comet key={l.id} line={l} placement={placement} />)}
    </View>
  );
}

export default memo(MetroBackdrop);
