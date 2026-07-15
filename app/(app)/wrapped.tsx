import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { usePlacesStore } from "../../stores/placesStore";
import { computeWrappedStats, formatMonthYear } from "../../lib/wrappedStats";
import {
  DashDivider,
  mono,
  ReceiptEdge,
  ReceiptHeader,
  ReceiptLine,
} from "../../components/receipt";

export default function WrappedScreen() {
  const router = useRouter();
  const places = usePlacesStore((s) => s.places);
  const { width } = useWindowDimensions();

  const stats = useMemo(() => computeWrappedStats(places), [places]);

  const closeButton = (
    <Pressable
      onPress={() => router.back()}
      className="absolute right-5 top-16 z-10 h-10 w-10 items-center justify-center rounded-full bg-black/60"
    >
      <Text className="text-xl text-white">✕</Text>
    </Pressable>
  );

  if (stats.totalSpots === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950 px-8">
        {closeButton}
        <Text className="text-7xl">🍜</Text>
        <Text className="mt-6 text-center text-2xl font-black tracking-widest text-white">
          NOTHING TO WRAP YET
        </Text>
        <Text className="mt-2 text-center text-zinc-400">
          Log some bites first, then come back for your recap.
        </Text>
      </View>
    );
  }

  const since = formatMonthYear(stats.earliestDate);
  const avg = stats.averageRating;

  const Card = ({ children }: { children: React.ReactNode }) => (
    <View style={{ width }} className="flex-1 items-center justify-center px-8">
      {children}
    </View>
  );
  const Big = ({ children }: { children: React.ReactNode }) => (
    <Text className="text-center text-6xl font-black text-amber-400">{children}</Text>
  );
  const Label = ({ children }: { children: React.ReactNode }) => (
    <Text className="mt-4 text-center text-lg uppercase tracking-widest text-zinc-300">
      {children}
    </Text>
  );

  return (
    <View className="flex-1 bg-zinc-950">
      {closeButton}
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {/* 1 — Intro */}
        <Card>
          <Text className="text-center text-4xl font-black tracking-widest text-white">
            YOUR{"\n"}ORTIBITES{"\n"}WRAPPED
          </Text>
          <Text className="mt-6 text-2xl">✨</Text>
          <Text className="mt-6 text-center text-zinc-400">
            swipe to relive your food year →
          </Text>
        </Card>

        {/* 2 — Total spots */}
        <Card>
          <Big>{stats.totalSpots}</Big>
          <Label>spots logged</Label>
          {since ? (
            <Text className="mt-2 text-center text-zinc-500">since {since}</Text>
          ) : null}
        </Card>

        {/* 3 — Top dish */}
        <Card>
          <Text className="text-5xl">🍽️</Text>
          <Text className="mt-4 text-center text-3xl font-black text-amber-400">
            {stats.topDish ?? "No favorite dish yet"}
          </Text>
          {stats.topDish ? <Label>your top dish</Label> : null}
        </Card>

        {/* 4 — Highest rated */}
        <Card>
          {stats.highestRated ? (
            <>
              <Text className="text-center text-3xl font-black text-white">
                {stats.highestRated.name}
              </Text>
              <Text className="mt-3 text-2xl text-amber-400">
                {"★".repeat(Math.round(stats.highestRated.rating))}
              </Text>
              <Label>highest rated</Label>
            </>
          ) : (
            <Text className="text-center text-xl text-zinc-400">No ratings yet</Text>
          )}
        </Card>

        {/* 5 — Average rating */}
        <Card>
          {avg !== null ? (
            <>
              <Big>{avg.toFixed(1)}</Big>
              <Label>average rating</Label>
              <Text className="mt-2 text-zinc-500">
                across {stats.ratedCount} rated spots
              </Text>
            </>
          ) : (
            <Text className="text-center text-xl text-zinc-400">
              Rate some spots to see this
            </Text>
          )}
        </Card>

        {/* 6 — Receipt summary */}
        <Card>
          <View className="w-full">
            <ReceiptEdge dir="top" />
            <View className="bg-zinc-900 px-5 pb-4 pt-3">
              <ReceiptHeader caption="YOUR WRAPPED" />
              <DashDivider />
              <ReceiptLine label="SPOTS" value={String(stats.totalSpots)} />
              <ReceiptLine label="TOP DISH" value={stats.topDish ?? "—"} />
              <ReceiptLine label="TOP SPOT" value={stats.highestRated?.name ?? "—"} />
              <ReceiptLine
                label="AVG RATING"
                value={avg !== null ? `${avg.toFixed(1)}/5` : "—"}
              />
              <ReceiptLine label="SINCE" value={since ?? "—"} />
              <DashDivider />
              <Text style={mono} className="text-center text-xs text-zinc-500">
                image sharing coming in v2.0.0
              </Text>
            </View>
            <ReceiptEdge dir="bottom" />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
