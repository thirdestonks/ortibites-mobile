import React, { useCallback, useMemo, useRef, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useFocusEffect } from "expo-router";

import { usePlacesStore } from "../../stores/placesStore";
import { useHubsStore } from "../../stores/hubsStore";
import ScreenWrapper from "../../components/ScreenWrapper";
import ScreenHeader from "../../components/ScreenHeader";
import EmptyState from "../../components/EmptyState";
import MetroNetworkMap from "../../components/MetroNetworkMap";
import StationSection from "../../components/StationSection";
import SpineRail, { TrackEnd } from "../../components/SpineRail";
import StationCardStack from "../../components/StationCardStack";
import { getLineColor, UNSORTED_LINE_COLOR } from "../../utils/lineColors";
import type { Place } from "../../types/place";

const UNSORTED_KEY = "unsorted";

export default function MetroScreen() {
  const places = usePlacesStore((s) => s.places);
  const loading = usePlacesStore((s) => s.loading);
  const fetchPlaces = usePlacesStore((s) => s.fetchPlaces);
  const incrementRevisit = usePlacesStore((s) => s.incrementRevisit);
  const decrementRevisit = usePlacesStore((s) => s.decrementRevisit);
  const hubs = useHubsStore((s) => s.hubs);
  const fetchHubs = useHubsStore((s) => s.fetchHubs);

  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});
  const spineY = useRef(0);
  const [showStationList, setShowStationList] = useState(false);
  const [spineHeight, setSpineHeight] = useState(0);

  useFocusEffect(
    useCallback(() => {
      // Quiet: coming back from a detail screen refreshes in the background
      // instead of replacing the line with a spinner.
      fetchHubs();
      fetchPlaces({ quiet: true });
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
    if (y != null)
      scrollRef.current?.scrollTo({ y: spineY.current + y, animated: true });
  };

  // Decide and Log out moved into FabMenu — the header stays clean so the
  // network map can sit right under the title.
  const stopCount = (
    <Text
      className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80"
    >
      {places.length} {places.length === 1 ? "stop" : "stops"}
    </Text>
  );

  return (
    <ScreenWrapper>
      <ScreenHeader title="ORTIBITES" subtitle="kain ano tara?? 🍜" right={stopCount} />

      {!loading && places.length === 0 && hubs.length === 0 ? (
        <EmptyState
          pose="explorer"
          title="NO BITES YET"
          subtitle="Add your first food spot 🍜"
        />
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
          {/* The map always stays put; editing stations opens over it */}
          <Animated.View entering={FadeIn.duration(200)}>
            <MetroNetworkMap
              hubs={hubs}
              onSelectHub={scrollToHub}
              onOpenStationList={() => setShowStationList(true)}
            />
          </Animated.View>

          {/* Spine: one rail drawn behind every station, so a single train
              runs the whole line instead of one pulse restarting per stop. */}
          <View
            className="relative"
            onLayout={(e) => {
              setSpineHeight(e.nativeEvent.layout.height);
              // Station offsets below are measured inside this wrapper, so
              // scrollToHub has to add the wrapper's own offset back on.
              spineY.current = e.nativeEvent.layout.y;
            }}
          >
            <SpineRail height={spineHeight} />

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
                  onUndoRevisit={decrementRevisit}
                  sectionIndex={hubIndex}
                  lineColor={getLineColor(hubIndex)}
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
                  onUndoRevisit={decrementRevisit}
                  sectionIndex={hubs.length}
                  lineColor={UNSORTED_LINE_COLOR}
                />
              </View>
            )}
          </View>

          {/* Sits outside the measured spine so the rail stops at the buffer */}
          <TrackEnd stops={hubs.length + (hasUnsorted ? 1 : 0)} />
        </ScrollView>
      )}

      <StationCardStack
        visible={showStationList}
        onClose={() => setShowStationList(false)}
      />
    </ScreenWrapper>
  );
}
