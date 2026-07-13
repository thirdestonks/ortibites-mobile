import { useEffect } from "react";
import { View, type DimensionValue } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type DotProps = {
  color: string;
  size: number;
  left: DimensionValue;
  top: DimensionValue;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
  maxOpacity: number;
};

function Dot({
  color,
  size,
  left,
  top,
  driftX,
  driftY,
  duration,
  delay,
  maxOpacity,
}: DotProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration }), -1, true)
    );
  }, [progress, delay, duration]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: driftX * progress.value },
      { translateY: driftY * progress.value },
    ],
    opacity: maxOpacity * (0.35 + 0.65 * progress.value),
  }));

  return (
    <Animated.View
      style={[style, { left, top, width: size, height: size }]}
      className={`absolute rounded-full ${color}`}
    />
  );
}

const DOTS: DotProps[] = [
  { color: "bg-red-500", size: 180, left: "-8%", top: "12%", driftX: 40, driftY: 30, duration: 8000, delay: 0, maxOpacity: 0.22 },
  { color: "bg-emerald-400", size: 150, left: "60%", top: "6%", driftX: -30, driftY: 40, duration: 9000, delay: 400, maxOpacity: 0.16 },
  { color: "bg-red-600", size: 220, left: "55%", top: "55%", driftX: 30, driftY: -35, duration: 10000, delay: 800, maxOpacity: 0.2 },
  { color: "bg-teal-400", size: 130, left: "5%", top: "60%", driftX: 35, driftY: -25, duration: 7000, delay: 1200, maxOpacity: 0.15 },
  { color: "bg-amber-400", size: 110, left: "30%", top: "35%", driftX: -25, driftY: 30, duration: 8500, delay: 600, maxOpacity: 0.12 },
  { color: "bg-emerald-500", size: 160, left: "75%", top: "75%", driftX: -35, driftY: -30, duration: 9500, delay: 200, maxOpacity: 0.14 },
  { color: "bg-red-500", size: 120, left: "20%", top: "85%", driftX: 25, driftY: -40, duration: 7500, delay: 1000, maxOpacity: 0.18 },
];

export default function GlowDots() {
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      {DOTS.map((d, i) => (
        <Dot key={i} {...d} />
      ))}
    </View>
  );
}
