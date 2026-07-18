import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import type { Place } from "../types/place";
import { DURATION, EASE_OUT, STAGGER_MS } from "../utils/motion";
import MetroCard from "./MetroCard";

type Props = {
  label: string;
  places: Place[];
  onRevisit: (id: number) => void;
  sectionIndex: number;
};

export default function StationSection({ label, places, onRevisit, sectionIndex }: Props) {
  const lineScale = useSharedValue(0);

  useEffect(() => {
    lineScale.value = withTiming(1, { duration: DURATION.base, easing: EASE_OUT });
  }, []);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: lineScale.value }],
  }));

  const pulseProgress = useSharedValue(0);

  useEffect(() => {
    // Travels top->bottom over 1200ms, then pauses before the next cycle,
    // for a total period of ~2000ms per the user's "every 2 secs" request.
    pulseProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withDelay(800, withTiming(0, { duration: 0 }))
      ),
      -1, // infinite
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => {
    const t = pulseProgress.value; // 0 = top/start of travel, 1 = bottom/end of travel, holds at 0 during the pause
    // Fade in over the first 10% of the travel and fade out over the last 15%, so the dot doesn't pop in/out abruptly.
    let opacity = 1;
    if (t < 0.1) opacity = t / 0.1;
    else if (t > 0.85) opacity = Math.max(0, (1 - t) / 0.15);
    return {
      top: `${t * 100}%`,
      opacity,
    };
  });

  const trailStyle = useAnimatedStyle(() => {
    const raw = pulseProgress.value - 0.06; // the trail lags 0.06 behind the main dot's progress
    const clamped = Math.min(Math.max(raw, 0), 1);
    let opacity = 0;
    if (raw >= 0 && raw <= 1) {
      if (raw < 0.1) opacity = raw / 0.1;
      else if (raw > 0.85) opacity = Math.max(0, (1 - raw) / 0.15);
      else opacity = 1;
    }
    return {
      top: `${clamped * 100}%`,
      opacity: opacity * 0.35, // noticeably dimmer than the main dot
    };
  });

  return (
    <View className="relative items-center">
      {/* Spine connecting line */}
      <Animated.View
        className="absolute bottom-0 left-1/2 top-0 -ml-0.5 w-1 bg-amber-500"
        style={[{ transformOrigin: "top" }, lineStyle]}
      />

      {/* Trailing comet tail, derived from the same pulseProgress, lagging behind the main dot */}
      <Animated.View
        pointerEvents="none"
        style={[
          { position: "absolute", left: "50%", marginLeft: -5, width: 10, height: 10 },
          trailStyle,
        ]}
        className="rounded-full bg-amber-100"
      />

      {/* Traveling pulse dot on the spine */}
      <Animated.View
        pointerEvents="none"
        style={[
          { position: "absolute", left: "50%", marginLeft: -8, width: 16, height: 16 },
          pulseStyle,
        ]}
        className="rounded-full bg-amber-100"
      >
        <View
          className="rounded-full bg-amber-100"
          style={{
            width: 16,
            height: 16,
            shadowColor: "#fbbf24",
            shadowRadius: 10,
            shadowOpacity: 0.9,
            shadowOffset: { width: 0, height: 0 },
            elevation: 6,
          }}
        />
      </Animated.View>

      {/* Station pin + label */}
      <Animated.View
        entering={FadeInDown.delay(sectionIndex * 150)
          .duration(DURATION.slow)
          .easing(EASE_OUT)}
        className="w-full flex-row items-center justify-center gap-3 py-2"
      >
        <View className="h-12 w-12 items-center justify-center rounded-full bg-orange-400">
          <MaterialIcons name="train" size={22} color="white" />
        </View>
        <Text className="text-2xl font-extrabold uppercase tracking-widest text-zinc-100">
          {label}
        </Text>
      </Animated.View>

      {/* Cards, alternating sides down the spine */}
      {places.map((place, i) => {
        return (
          <Animated.View
            key={place.id}
            entering={FadeInDown.delay(sectionIndex * 150 + (i + 1) * 90)
              .duration(DURATION.slow)
              .easing(EASE_OUT)}
            className={`w-full flex-row ${i % 2 === 0 ? "justify-start" : "justify-end"} py-2`}
          >
            <View className="w-[70%]">
              <MetroCard place={place} onRevisit={onRevisit} />
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}
