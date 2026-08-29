import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { DashDivider, ReceiptEdge, ReceiptHeader } from "./receipt";

/**
 * A shimmering placeholder bar. Sized in the caller so the skeleton matches the
 * real receipt's rhythm and nothing jumps when content lands.
 */
export function SkelBar({
  w,
  h = 10,
  className = "",
}: {
  w: number | `${number}%`;
  h?: number;
  className?: string;
}) {
  const t = useSharedValue(0.35);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(0.9, { duration: 750, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [t]);

  const style = useAnimatedStyle(() => ({ opacity: t.value }));

  return (
    <Animated.View
      style={[{ width: w, height: h, borderRadius: 4 }, style]}
      className={`bg-zinc-700 ${className}`}
    />
  );
}

/**
 * Receipt-shaped loading state for a cold open (deep link, or a place that
 * isn't in the store yet). Deliberately not a spinner: it holds the same
 * layout the real receipt will occupy.
 */
export default function ReceiptSkeleton() {
  return (
    <View>
      <ReceiptEdge dir="top" />
      <View className="bg-zinc-900 px-5 pb-6 pt-3">
        <ReceiptHeader caption="RECEIPT" />

        <View className="mt-3 flex-row justify-between">
          <SkelBar w={54} h={9} />
          <SkelBar w={38} h={9} />
        </View>

        <DashDivider />

        <SkelBar w="62%" h={18} />
        <View className="mt-3">
          <SkelBar w={104} h={14} />
        </View>
        <View className="mt-4 gap-2">
          <SkelBar w="100%" />
          <SkelBar w="80%" />
        </View>

        <DashDivider />

        <SkelBar w={42} h={9} />
        <View className="mt-2 gap-1.5">
          <SkelBar w="70%" />
          <SkelBar w="55%" />
        </View>

        <DashDivider />

        <SkelBar w={42} h={9} />
        <View className="mt-2">
          <SkelBar w="62%" />
        </View>
      </View>
      <ReceiptEdge dir="bottom" />
    </View>
  );
}
