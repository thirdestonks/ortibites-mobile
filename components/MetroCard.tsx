import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import type { Place } from "../types/place";
import { useGuardedPush } from "../utils/navigation";
import { PRESS_SPRING } from "../utils/motion";
import { mono, ReceiptEdge } from "./receipt";
import type { LineColor } from "../utils/lineColors";

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

type Props = {
  place: Place;
  onRevisit: (id: number) => void;
  onUndoRevisit: (id: number, currentCount: number) => void;
  lineColor: LineColor;
};

export default function MetroCard({ place, onRevisit, onUndoRevisit, lineColor }: Props) {
  const push = useGuardedPush();
  const revisitCount = place.revisit_count ?? 0;

  // Slow lava-lamp-style drift: the gradient axis gently rotates back and
  // forth instead of sitting flat, ~14s per full cycle.
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [drift]);

  const gradientProps = useAnimatedProps(() => ({
    start: {
      x: interpolate(drift.value, [0, 1], [0, 0.35]),
      y: interpolate(drift.value, [0, 1], [0, 0.15]),
    },
    end: {
      x: interpolate(drift.value, [0, 1], [1, 0.65]),
      y: interpolate(drift.value, [0, 1], [1, 0.85]),
    },
  }));

  const revisitScale = useSharedValue(1);
  const revisitStyle = useAnimatedStyle(() => ({
    transform: [{ scale: revisitScale.value }],
  }));

  const minusScale = useSharedValue(1);
  const minusStyle = useAnimatedStyle(() => ({
    transform: [{ scale: minusScale.value }],
  }));

  const bump = (scale: typeof revisitScale) => {
    scale.value = withSequence(
      withTiming(0.85, { duration: 80 }),
      withSpring(1, PRESS_SPRING)
    );
  };

  // Ink-stamp effect: slams down oversized/crooked, settles with a bounce,
  // holds briefly, then fades — like stamping the ticket on revisit.
  const stampOpacity = useSharedValue(0);
  const stampScale = useSharedValue(1.7);
  const stampRotate = useSharedValue(-14);
  const stampStyle = useAnimatedStyle(() => ({
    opacity: stampOpacity.value,
    transform: [{ scale: stampScale.value }, { rotate: `${stampRotate.value}deg` }],
  }));

  const playStamp = () => {
    stampScale.value = 1.7;
    stampRotate.value = -14;
    stampOpacity.value = withSequence(
      withTiming(1, { duration: 50 }),
      withDelay(550, withTiming(0, { duration: 250 }))
    );
    stampScale.value = withSpring(1, { damping: 8, stiffness: 260, mass: 0.6 });
    stampRotate.value = withSpring(-8, { damping: 8, stiffness: 260, mass: 0.6 });
  };

  const handleRevisitPress = () => {
    onRevisit(place.id);
    bump(revisitScale);
    playStamp();
  };

  const handleUndoPress = () => {
    if (revisitCount <= 0) return;
    onUndoRevisit(place.id, revisitCount);
    bump(minusScale);
  };

  return (
    <Pressable onPress={() => push(`/place/${place.id}`)}>
      <ReceiptEdge dir="top" color={lineColor.bg} />
      <AnimatedGradient
        colors={[lineColor.bg, lineColor.bg2]}
        animatedProps={gradientProps}
        className="px-4 py-3"
        style={{ borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor: lineColor.border }}
      >
        <Animated.View
          pointerEvents="none"
          className="absolute inset-0 z-10 items-center justify-center"
          style={stampStyle}
        >
          <View
            className="items-center justify-center rounded-full px-4 py-2"
            style={{ borderWidth: 3, borderColor: lineColor.border }}
          >
            <Text
              style={[mono, { color: lineColor.border }]}
              className="text-sm font-black uppercase tracking-widest"
            >
              ✓ Revisited
            </Text>
          </View>
        </Animated.View>
        <Text style={[mono, { color: lineColor.inkMuted }]} className="text-[9px] font-bold uppercase tracking-widest">
          {lineColor.label}
        </Text>
        <Text
          style={[mono, { color: lineColor.ink }]}
          className="mt-1 text-base font-bold uppercase tracking-wide"
          numberOfLines={1}
        >
          {place.name}
        </Text>
        <View className="my-2 border-t border-dashed" style={{ borderColor: lineColor.border }} />
        <View className="flex-row items-center justify-between">
          <Text style={[mono, { color: lineColor.inkMuted }]} className="text-xs">
            VISITS: {revisitCount}
          </Text>
          <View className="flex-row items-center gap-2">
            <Animated.View style={minusStyle}>
              <Pressable
                onPress={handleUndoPress}
                disabled={revisitCount <= 0}
                hitSlop={8}
                className="h-6 w-6 items-center justify-center rounded-full border"
                style={{
                  borderColor: lineColor.border,
                  opacity: revisitCount <= 0 ? 0.35 : 1,
                }}
              >
                <Text style={[mono, { color: lineColor.ink }]} className="text-xs font-bold">
                  −
                </Text>
              </Pressable>
            </Animated.View>
            <Animated.View style={revisitStyle}>
              <Pressable
                onPress={handleRevisitPress}
                hitSlop={8}
                className="rounded-full border px-3 py-1"
                style={{ borderColor: lineColor.ink }}
              >
                <Text
                  style={[mono, { color: lineColor.ink }]}
                  className="text-[11px] font-bold uppercase tracking-widest"
                >
                  + Revisit
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </AnimatedGradient>
      <ReceiptEdge dir="bottom" color={lineColor.bg2} />
    </Pressable>
  );
}
