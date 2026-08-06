import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { ZoomIn } from "react-native-reanimated";

import ScreenWrapper from "../../components/ScreenWrapper";
import ScreenHeader from "../../components/ScreenHeader";
import { usePlacesStore } from "../../stores/placesStore";
import {
  computeWrappedStats,
  filterPlacesByPeriod,
  formatMonthYear,
  type WrappedPeriod,
} from "../../lib/wrappedStats";
import { mono, PeriodToggle, PinnedCard } from "../../components/receipt";

export default function WrappedScreen() {
  const router = useRouter();
  const places = usePlacesStore((s) => s.places);
  const [period, setPeriod] = useState<WrappedPeriod>("weekly");

  const stats = useMemo(
    () => computeWrappedStats(filterPlacesByPeriod(places, period)),
    [places, period]
  );

  const closeButton = (
    <Pressable
      onPress={() => router.back()}
      className="h-9 w-9 items-center justify-center rounded-full bg-black/60"
    >
      <Text className="text-lg text-white">✕</Text>
    </Pressable>
  );

  if (stats.totalSpots === 0) {
    return (
      <ScreenWrapper>
        <ScreenHeader
          title="WRAPPED"
          subtitle="your food story, pinned up"
          right={closeButton}
        />
        <View className="mb-8">
          <PeriodToggle period={period} onChange={setPeriod} />
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-7xl">🍜</Text>
          <Text className="mt-6 text-center text-2xl font-black tracking-widest text-white">
            NOTHING TO WRAP YET
          </Text>
          <Text className="mt-2 text-center text-zinc-400">
            Log some bites this {period === "weekly" ? "week" : "month"} and
            come back for your recap.
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  const since = formatMonthYear(stats.earliestDate);
  const avg = stats.averageRating;

  const cards = [
    <PinnedCard key="spots" rotate={-3}>
      <Text style={mono} className="text-center text-xs text-zinc-400">
        SPOTS LOGGED
      </Text>
      <Text className="mt-1 text-center text-5xl font-black text-amber-400">
        {stats.totalSpots}
      </Text>
    </PinnedCard>,

    <PinnedCard key="dish" rotate={2}>
      <Text style={mono} className="text-center text-xs text-zinc-400">
        TOP DISH
      </Text>
      <Text className="mt-1 text-center text-2xl font-black text-white">
        {stats.topDish ?? "No favorite dish yet"}
      </Text>
    </PinnedCard>,

    <PinnedCard key="spot" rotate={-2}>
      <Text style={mono} className="text-center text-xs text-zinc-400">
        TOP SPOT
      </Text>
      {stats.highestRated ? (
        <>
          <Text className="mt-1 text-center text-2xl font-black text-white">
            {stats.highestRated.name}
          </Text>
          <Text className="mt-2 text-center text-lg text-amber-400">
            {"★".repeat(Math.round(stats.highestRated.rating))}
          </Text>
        </>
      ) : (
        <Text className="mt-1 text-center text-zinc-500">No ratings yet</Text>
      )}
    </PinnedCard>,

    <PinnedCard key="avg" rotate={3}>
      <Text style={mono} className="text-center text-xs text-zinc-400">
        AVERAGE RATING
      </Text>
      {avg !== null ? (
        <>
          <Text className="mt-1 text-center text-4xl font-black text-amber-400">
            {avg.toFixed(1)}/5
          </Text>
          <Text className="mt-1 text-center text-zinc-500">
            across {stats.ratedCount} rated spots
          </Text>
        </>
      ) : (
        <Text className="mt-1 text-center text-zinc-500">
          Rate some spots to see this
        </Text>
      )}
    </PinnedCard>,

    <PinnedCard key="since" rotate={-1}>
      <Text style={mono} className="text-center text-xs text-zinc-400">
        SINCE
      </Text>
      <Text className="mt-1 text-center text-2xl font-black text-white">
        {since ?? "—"}
      </Text>
    </PinnedCard>,
  ];

  return (
    <ScreenWrapper scroll>
      <ScreenHeader
        title="WRAPPED"
        subtitle="your food story, pinned up"
        right={closeButton}
      />

      <View className="mb-8">
        <PeriodToggle period={period} onChange={setPeriod} />
      </View>

      <View className="gap-8 pb-10">
        {cards.map((card, i) => (
          <Animated.View
            key={card.key}
            entering={ZoomIn.delay(i * 160).springify().damping(12)}
          >
            {card}
          </Animated.View>
        ))}
      </View>
    </ScreenWrapper>
  );
}
