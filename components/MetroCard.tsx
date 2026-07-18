import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import type { Place } from "../types/place";
import { useGuardedPush } from "../utils/navigation";
import { PRESS_SPRING } from "../utils/motion";
import { mono, ReceiptEdge, DashDivider } from "./receipt";

type Props = {
  place: Place;
  onRevisit: (id: number) => void;
};

export default function MetroCard({ place, onRevisit }: Props) {
  const push = useGuardedPush();

  const revisitScale = useSharedValue(1);
  const revisitStyle = useAnimatedStyle(() => ({
    transform: [{ scale: revisitScale.value }],
  }));

  const handleRevisitPress = () => {
    onRevisit(place.id);
    revisitScale.value = withSequence(
      withTiming(0.85, { duration: 80 }),
      withSpring(1, PRESS_SPRING)
    );
  };

  return (
    <Pressable onPress={() => push(`/place/${place.id}`)}>
      <ReceiptEdge dir="top" />
      <View className="bg-zinc-900 px-4 py-3">
        <Text
          style={mono}
          className="text-base font-bold uppercase tracking-wide text-amber-100"
          numberOfLines={1}
        >
          {place.name}
        </Text>
        <DashDivider />
        <View className="flex-row items-center justify-between">
          <Text style={mono} className="text-xs text-zinc-400">
            VISITS: {place.revisit_count ?? 0}
          </Text>
          <Animated.View style={revisitStyle}>
            <Pressable
              onPress={handleRevisitPress}
              className="rounded-full border border-amber-400/70 bg-amber-400/10 px-3 py-1"
            >
              <Text style={mono} className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                Revisit
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
      <ReceiptEdge dir="bottom" />
    </Pressable>
  );
}
