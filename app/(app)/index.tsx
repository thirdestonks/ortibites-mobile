import React, { useCallback, useMemo, useRef } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";

import { useGuardedPush } from "../../utils/navigation";
import { usePlacesStore } from "../../stores/placesStore";
import { useHubsStore } from "../../stores/hubsStore";
import { useAuthStore } from "../../stores/authStore";
import ScreenWrapper from "../../components/ScreenWrapper";
import ScreenHeader from "../../components/ScreenHeader";
import EmptyState from "../../components/EmptyState";
import MetroNetworkMap from "../../components/MetroNetworkMap";
import StationSection from "../../components/StationSection";
import type { Place } from "../../types/place";

const UNSORTED_KEY = "unsorted";

export default function MetroScreen() {
  const places = usePlacesStore((s) => s.places);
  const loading = usePlacesStore((s) => s.loading);
  const fetchPlaces = usePlacesStore((s) => s.fetchPlaces);
  const incrementRevisit = usePlacesStore((s) => s.incrementRevisit);
  const hubs = useHubsStore((s) => s.hubs);
  const fetchHubs = useHubsStore((s) => s.fetchHubs);
  const signOut = useAuthStore((s) => s.signOut);
  const push = useGuardedPush();

  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      fetchHubs();
      fetchPlaces();
    }, [fetchHubs, fetchPlaces])
  );

  // Group places by hub_id.
  const byHub = useMemo(() => {
    const map: Record<string, Place[]> = {};
    for (const p of places) {
      const key = p.hub_id != null ? String(p.hub_id) : UNSORTED_KEY;
      (map[key] ??= []).push(p);
    }
    return map;
  }, [places]);

  const hasUnsorted = (byHub[UNSORTED_KEY]?.length ?? 0) > 0;

  const scrollToHub = (hubId: number) => {
    const y = offsets.current[String(hubId)];
    if (y != null) scrollRef.current?.scrollTo({ y, animated: true });
  };

  const logoutButton = (
    <Pressable
      onPress={signOut}
      className="rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-2"
    >
      <Text className="text-xs font-bold uppercase tracking-widest text-amber-400">
        Log out
      </Text>
    </Pressable>
  );

  const decideButton = (
    <Pressable
      onPress={() => push("/roulette")}
      className="rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-2"
    >
      <Text className="text-xs font-bold uppercase tracking-widest text-amber-400">
        🎲 Decide
      </Text>
    </Pressable>
  );

  const headerActions = (
    <View className="items-end gap-2">
      {decideButton}
      {logoutButton}
    </View>
  );

  return (
    <ScreenWrapper>
      <ScreenHeader title="ORTIBITES" subtitle="kain ano tara?? 🍜" right={headerActions} />

      {places.length === 0 && hubs.length === 0 ? (
        <EmptyState title="NO BITES YET" subtitle="Add your first food spot 🍜" />
      ) : (
        <ScrollView
          ref={scrollRef}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => {
                fetchHubs();
                fetchPlaces();
              }}
              tintColor="#fb923c"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 180 }}
        >
          {/* Network map (scrolls with content) */}
          <MetroNetworkMap hubs={hubs} onSelectHub={scrollToHub} />

          {/* Spine: one section per hub, in hub order */}
          {hubs.map((hub, hubIndex) => (
            <View
              key={hub.id}
              onLayout={(e) => {
                offsets.current[String(hub.id)] = e.nativeEvent.layout.y;
              }}
            >
              <StationSection
                label={hub.name}
                places={byHub[String(hub.id)] ?? []}
                onRevisit={incrementRevisit}
                sectionIndex={hubIndex}
              />
            </View>
          ))}

          {/* UNSORTED section for places with no hub */}
          {hasUnsorted && (
            <View
              onLayout={(e) => {
                offsets.current[UNSORTED_KEY] = e.nativeEvent.layout.y;
              }}
            >
              <StationSection
                label="UNSORTED"
                places={byHub[UNSORTED_KEY]}
                onRevisit={incrementRevisit}
                sectionIndex={hubs.length}
              />
            </View>
          )}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}
