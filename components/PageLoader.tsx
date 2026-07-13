import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { DURATION, EASE_OUT } from "../utils/motion";

export default function PageLoader() {
  const bowl = useSharedValue(0);
  const glow = useSharedValue(0);
  const label = useSharedValue(0);

  useEffect(() => {
    bowl.value = withRepeat(
      withTiming(1, { duration: DURATION.slow, easing: EASE_OUT }),
      -1,
      true
    );
    glow.value = withRepeat(withTiming(1, { duration: 1800 }), -1, true);
    label.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, [bowl, glow, label]);

  const bowlStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -12 * bowl.value },
      { scale: 1 + 0.08 * bowl.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + 0.4 * glow.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + 0.6 * label.value,
  }));

  return (
    <View className="flex-1 items-center justify-center overflow-hidden bg-zinc-950">
      {/* BACKGROUND GLOWS */}
      <Animated.View
        style={glowStyle}
        className="absolute -top-10 -left-10 h-56 w-56 rounded-full bg-orange-500/20"
      />
      <Animated.View
        style={glowStyle}
        className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-400/10"
      />
      <Animated.View
        style={glowStyle}
        className="absolute top-1/3 right-10 h-32 w-32 rounded-full bg-red-500/10"
      />

      {/* CONTENT */}
      <Animated.Text style={bowlStyle} className="text-7xl">
        🍜
      </Animated.Text>

      <Animated.Text
        style={labelStyle}
        className="mt-5 text-lg font-bold tracking-[6px] text-amber-400"
      >
        LOADING BITES...
      </Animated.Text>
    </View>
  );
}
