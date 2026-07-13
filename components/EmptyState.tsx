import { useEffect } from "react";
import { Text } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { DURATION, EASE_OUT } from "../utils/motion";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  subtitle?: string;
}

export default function EmptyState({
  emoji = "🍽️",
  title,
  subtitle,
}: EmptyStateProps) {
  const bob = useSharedValue(0);

  useEffect(() => {
    bob.value = withRepeat(
      withTiming(1, { duration: 1600, easing: EASE_OUT }),
      -1,
      true
    );
  }, [bob]);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -10 * bob.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(DURATION.base)}
      className="flex-1 items-center justify-center"
    >
      <Animated.Text style={bobStyle} className="text-7xl">
        {emoji}
      </Animated.Text>

      <Text className="mt-5 text-lg font-bold tracking-[6px] text-amber-400">
        {title}
      </Text>

      {subtitle ? (
        <Text className="mt-2 text-zinc-400">{subtitle}</Text>
      ) : null}
    </Animated.View>
  );
}
