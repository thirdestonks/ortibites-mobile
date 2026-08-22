import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";

import ScreenWrapper from "../../components/ScreenWrapper";
import ScreenHeader from "../../components/ScreenHeader";
import { usePlacesStore } from "../../stores/placesStore";
import {
  computeWrappedStats,
  filterPlacesByPeriod,
  type WrappedPeriod,
} from "../../lib/wrappedStats";
import { mono, PeriodToggle } from "../../components/receipt";
import {
  CardCaption,
  CardDivider,
  CardLabel,
  CardValue,
  pickCardArt,
  WrappedCard,
} from "../../components/wrappedCards";
import { DURATION, EASE_OUT } from "../../utils/motion";

/** Filled stars out of five, so the unearned ones stay visible. */
const stars = (n: number) => "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));

const starStyle = {
  color: "#fbbf24",
  letterSpacing: 2,
  textShadowColor: "rgba(0,0,0,0.9)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
} as const;

export default function WrappedScreen() {
  const router = useRouter();
  const places = usePlacesStore((s) => s.places);
  const [period, setPeriod] = useState<WrappedPeriod>("weekly");

  const stats = useMemo(
    () => computeWrappedStats(filterPlacesByPeriod(places, period)),
    [places, period]
  );

  // Drawn once per mount so the three cards don't reshuffle mid-view.
  const cardArt = useMemo(
    () => pickCardArt(["spots", "highlights", "rating"]),
    []
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
      <ScreenWrapper dim>
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

  const avg = stats.averageRating;

  // Three cards, sized to fit one screen without scrolling. Artwork is drawn
  // fresh per mount via cardArt, so which piece backs each slot varies visit
  // to visit.
  const cards = [
    <WrappedCard key="spots" slot="spots" art={cardArt.spots}>
      <CardLabel>SPOTS LOGGED</CardLabel>
      <CardValue tone="accent">{stats.totalSpots.toLocaleString()}</CardValue>
    </WrappedCard>,

    // Top Spot and Top Dish share one card, split into two columns so the
    // paired stats use the safe zone's width rather than its limited height.
    <WrappedCard key="highlights" slot="highlights" art={cardArt.highlights}>
      <View className="w-full flex-row items-center">
        <View className="flex-1 px-1">
          <CardLabel>TOP SPOT</CardLabel>
          {stats.highestRated ? (
            <>
              <CardValue tone="accent" size="sm">
                {stats.highestRated.name}
              </CardValue>
              <Text style={starStyle} className="mt-0.5 text-center text-xs">
                {stars(Math.round(stats.highestRated.rating))}
              </Text>
            </>
          ) : (
            <CardValue size="sm">No ratings yet</CardValue>
          )}
        </View>

        <CardDivider />

        <View className="flex-1 px-1">
          <CardLabel>TOP DISH</CardLabel>
          <CardValue size="sm">
            {stats.topDish ?? "No favorite yet"}
          </CardValue>
        </View>
      </View>
    </WrappedCard>,

    <WrappedCard key="rating" slot="rating" art={cardArt.rating}>
      <CardLabel>AVERAGE RATING</CardLabel>
      <CardValue tone="accent">
        {avg !== null ? `${avg.toFixed(1)}/5` : "—"}
      </CardValue>
      <CardCaption>
        {avg !== null
          ? `across ${stats.ratedCount} rated spots`
          : "rate some spots to see this"}
      </CardCaption>
    </WrappedCard>,
  ];

  return (
    <ScreenWrapper dim>
      <ScreenHeader
        title="WRAPPED"
        subtitle="your food story, pinned up"
        right={closeButton}
      />

      <View className="mb-2">
        <PeriodToggle period={period} onChange={setPeriod} />
      </View>

      {/* Three equal rows split whatever height is left. Each card fills its
          row's height and derives its width from the art's ratio, so the deck
          scales to the screen instead of scrolling. */}
      <View className="flex-1 gap-2 pb-1">
        {cards.map((card, i) => (
          <Animated.View
            key={card.key}
            className="flex-1 items-center justify-center"
            entering={FadeInDown.delay(i * 110)
              .duration(DURATION.base)
              .easing(EASE_OUT)}
          >
            {card}
          </Animated.View>
        ))}
      </View>

      <Text
        style={{ ...mono, color: "#71717a" }}
        className="pb-2 text-center text-[10px]"
      >
        — ORTIBITES · {period.toUpperCase()} REPORT —
      </Text>
    </ScreenWrapper>
  );
}
