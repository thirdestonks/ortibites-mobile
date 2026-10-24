import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
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
import Animated, { withClassName } from "../utils/animatedInterop";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { Place } from "../types/place";
import { useGuardedPush } from "../utils/navigation";
import { PRESS_SPRING } from "../utils/motion";
import { mono } from "./receipt";
import type { LineColor } from "../utils/lineColors";

const AnimatedGradient = withClassName(Animated.createAnimatedComponent(LinearGradient));

type Props = {
  place: Place;
  onRevisit: (id: number) => void;
  onUndoRevisit: (id: number, currentCount: number) => void;
  lineColor: LineColor;
};

export default function MetroCard({ place, onRevisit, onUndoRevisit, lineColor }: Props) {
  const push = useGuardedPush();
  const revisitCount = place.revisit_count ?? 0;
  const [open, setOpen] = useState(false);
  const rating = Math.round(place.rating ?? 0);
  const dish = place.favorite_dishes?.[0];

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

  const ghost = { borderColor: lineColor.ink };

  return (
    <Pressable onPress={() => setOpen((v) => !v)}>
      <AnimatedGradient
        colors={[lineColor.bg, lineColor.bg2]}
        animatedProps={gradientProps}
        style={{
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: lineColor.border,
          overflow: "hidden",
        }}
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

        {/* One-line ticket: rating stub, name + meta, quick revisit */}
        <View className="flex-row items-center py-2.5 pl-3 pr-2.5" style={{ minHeight: 56 }}>
          <View
            className="mr-2.5 items-center justify-center self-stretch pr-2.5"
            style={{
              width: 40,
              borderRightWidth: 1.5,
              borderStyle: "dashed",
              borderColor: lineColor.border,
            }}
          >
            <Text style={[mono, { color: lineColor.inkMuted }]} className="text-[8px] font-bold">
              ★
            </Text>
            <Text style={[mono, { color: lineColor.ink }]} className="text-base font-black">
              {rating || "-"}
            </Text>
          </View>

          <View className="flex-1">
            <Text
              style={[mono, { color: lineColor.ink }]}
              className="text-sm font-bold uppercase tracking-wide"
              numberOfLines={1}
            >
              {place.name}
            </Text>
            <Text style={[mono, { color: lineColor.inkMuted }]} className="mt-0.5 text-[9.5px]">
              {rating ? `★${rating}` : "unrated"} · {revisitCount} visit
              {revisitCount === 1 ? "" : "s"}
            </Text>
          </View>

          <Animated.View style={revisitStyle}>
            <Pressable
              onPress={handleRevisitPress}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-full border"
              style={ghost}
            >
              <Text style={[mono, { color: lineColor.ink }]} className="text-base font-bold">
                +
              </Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* Details, only when the ticket is opened */}
        {open && (
          <View className="px-3 pb-3">
            <View className="mb-2 border-t border-dashed" style={{ borderColor: lineColor.border }} />
            {dish ? (
              <View className="flex-row justify-between py-0.5">
                <Text style={[mono, { color: lineColor.inkMuted }]} className="text-[10.5px]">
                  DISH
                </Text>
                <Text
                  style={[mono, { color: lineColor.ink }]}
                  className="ml-3 flex-1 text-right text-[10.5px] font-bold"
                  numberOfLines={1}
                >
                  {dish}
                </Text>
              </View>
            ) : null}
            {place.address ? (
              <View className="flex-row justify-between py-0.5">
                <Text style={[mono, { color: lineColor.inkMuted }]} className="text-[10.5px]">
                  LOC
                </Text>
                <Text
                  style={[mono, { color: lineColor.ink }]}
                  className="ml-3 flex-1 text-right text-[10.5px] font-bold"
                  numberOfLines={1}
                >
                  {place.address}
                </Text>
              </View>
            ) : null}
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
                    style={{ ...ghost, opacity: revisitCount <= 0 ? 0.35 : 1 }}
                  >
                    <Text style={[mono, { color: lineColor.ink }]} className="text-xs font-bold">
                      −
                    </Text>
                  </Pressable>
                </Animated.View>
                <Pressable
                  onPress={handleRevisitPress}
                  hitSlop={8}
                  className="rounded-full border px-3 py-1"
                  style={ghost}
                >
                  <Text
                    style={[mono, { color: lineColor.ink }]}
                    className="text-[11px] font-bold uppercase tracking-widest"
                  >
                    + Revisit
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => push(`/place/${place.id}`)}
                  hitSlop={8}
                  className="h-9 w-9 items-center justify-center rounded-full border"
                  style={ghost}
                >
                  <Ionicons name="arrow-forward" size={18} color={lineColor.ink} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </AnimatedGradient>
    </Pressable>
  );
}
