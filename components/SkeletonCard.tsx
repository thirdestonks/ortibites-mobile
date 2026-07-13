import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export default function SkeletonCard() {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [shimmer]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.4 + 0.6 * shimmer.value,
  }));

  return (
    <Animated.View
      style={style}
      className="mb-4 flex-row gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
    >
      {/* accent bar */}
      <View className="w-1.5 self-stretch rounded-full bg-zinc-700" />

      <View className="flex-1">
        {/* name */}
        <View className="h-5 w-1/2 rounded bg-zinc-700" />
        {/* stars */}
        <View className="mt-2 h-3 w-24 rounded bg-zinc-800" />
        {/* address */}
        <View className="mt-2 h-3 w-2/3 rounded bg-zinc-800" />
        {/* divider */}
        <View className="my-3 border-t border-dashed border-zinc-800" />
        {/* footer */}
        <View className="h-4 w-40 rounded bg-zinc-800" />
      </View>
    </Animated.View>
  );
}
