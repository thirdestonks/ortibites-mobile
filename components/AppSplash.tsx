import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { DURATION, EASE_OUT } from "../utils/motion";

function Dot({ delay }: { delay: number }) {
  const v = useSharedValue(0);

  useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 600 }), -1, true)
    );
  }, [v, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.3 + 0.7 * v.value,
    transform: [{ scale: 0.8 + 0.4 * v.value }],
  }));

  return (
    <Animated.View style={style} className="h-2 w-2 rounded-full bg-amber-400" />
  );
}

export default function AppSplash() {
  return (
    <Animated.View
      exiting={FadeOut.duration(DURATION.base)}
      className="absolute inset-0 items-center justify-center overflow-hidden bg-zinc-950"
    >
      {/* GLOW ORBS */}
      <View className="absolute -top-10 -left-10 h-56 w-56 rounded-full bg-orange-500/20" />
      <View className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-400/10" />
      <View className="absolute top-1/3 right-10 h-32 w-32 rounded-full bg-red-500/10" />

      {/* HERO */}
      <Animated.Text
        entering={FadeInDown.duration(DURATION.slow).easing(EASE_OUT)}
        className="text-8xl"
      >
        🍜
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.delay(120).duration(DURATION.slow).easing(EASE_OUT)}
        className="mt-4 text-6xl font-black tracking-widest text-white"
      >
        ORTIBITES
      </Animated.Text>

      <Animated.Text
        entering={FadeIn.delay(300).duration(DURATION.base)}
        className="mt-2 text-zinc-400"
      >
        your food memories 🍜
      </Animated.Text>

      {/* PROGRESS DOTS */}
      <View className="mt-8 flex-row gap-2">
        <Dot delay={0} />
        <Dot delay={180} />
        <Dot delay={360} />
      </View>
    </Animated.View>
  );
}
