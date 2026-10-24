import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from "react-native";
import { useFocusEffect } from "expo-router";

import { usePlacesStore } from "../../stores/placesStore";
import { useHubsStore } from "../../stores/hubsStore";
import ScreenWrapper from "../../components/ScreenWrapper";
import EmptyState from "../../components/EmptyState";
import RouteBar, { ROUTE_BAR_H, type RouteStop } from "../../components/RouteBar";
import NextStopCard, { pickNextStop } from "../../components/NextStopCard";
import StationSection from "../../components/StationSection";
import SpineRail, { TrackEnd } from "../../components/SpineRail";
import StationCardStack from "../../components/StationCardStack";
import { mono } from "../../components/receipt";
import { getLineColor, UNSORTED_LINE_COLOR } from "../../utils/lineColors";
import type { Place } from "../../types/place";

const UNSORTED_KEY = "unsorted";
/** The route bar's strip plus its padding, so a jump lands the heading below it. */
const STICKY_H = ROUTE_BAR_H + 12;

export default function MetroScreen() {
  const places = usePlacesStore((s) => s.places);
  const loading = usePlacesStore((s) => s.loading);
  const fetchPlaces = usePlacesStore((s) => s.fetchPlaces);
  const incrementRevisit = usePlacesStore((s) => s.incrementRevisit);
  const decrementRevisit = usePlacesStore((s) => s.decrementRevisit);
  const hubs = useHubsStore((s) => s.hubs);
  const fetchHubs = useHubsStore((s) => s.fetchHubs);

  const scrollRef = useRef<ScrollViewInstance>(null);
  const offsets = useRef<Record<string, number>>({});
  const spineY = useRef(0);
  const [showStationList, setShowStationList] = useState(false);
  const [spineHeight, setSpineHeight] = useState(0);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const activeRef = useRef<string | null>(null);

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
  const nextStop = useMemo(() => pickNextStop(places), [places]);

  // The route bar: one stop per station, same order and colours as the line below.
  const stops: RouteStop[] = useMemo(() => {
    const list: RouteStop[] = hubs.map((h, i) => ({
      key: String(h.id),
      label: h.name,
      color: getLineColor(i),
    }));
    if (hasUnsorted) list.push({ key: UNSORTED_KEY, label: "Unsorted", color: UNSORTED_LINE_COLOR });
    return list;
  }, [hubs, hasUnsorted]);

  const scrollToStop = (key: string) => {
    const y = offsets.current[key];
    if (y != null)
      scrollRef.current?.scrollTo({ y: Math.max(0, spineY.current + y - STICKY_H), animated: true });
  };

  // Scroll-spy: the station whose heading has most recently passed under the bar.
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y + STICKY_H + 24;
    let current = stops[0]?.key ?? null;
    for (const s of stops) {
      const o = offsets.current[s.key];
      if (o != null && spineY.current + o <= y) current = s.key;
    }
    if (current !== activeRef.current) {
      activeRef.current = current;
      setActiveKey(current);
    }
  };

  const toggleCollapsed = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Decide and Log out live in FabMenu, so the header only carries the title.
  return (
    <ScreenWrapper>
      <View className="mb-4 flex-row items-start justify-between">
        <View>
          <Text className="text-2xl font-black uppercase tracking-[.14em] text-zinc-100">
            Ortibites
          </Text>
          <Text
            style={mono}
            className="mt-1 text-[9px] uppercase tracking-[.2em] text-amber-400/80"
          >
            kain ano tara?? 🍜
          </Text>
        </View>
        <Text
          style={mono}
          className="pt-1 text-[10px] font-bold uppercase tracking-widest text-amber-400/80"
        >
          {places.length} {places.length === 1 ? "stop" : "stops"}
        </Text>
      </View>

      {!loading && places.length === 0 && hubs.length === 0 ? (
        <EmptyState
          pose="explorer"
          title="NO BITES YET"
          subtitle="Add your first food spot 🍜"
        />
      ) : (
        <ScrollView
          ref={scrollRef}
          // Child 1 is the route bar, so it pins to the top while the line scrolls.
          stickyHeaderIndices={[1]}
          onScroll={onScroll}
          scrollEventThrottle={32}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => {
                fetchHubs();
                fetchPlaces();
              }}
              tintColor="#fbbf24"
              colors={["#fbbf24"]}
              progressBackgroundColor="#18181b"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 180 }}
        >
          {/* Child 0 is always a View so the sticky index above never shifts. */}
          <View style={nextStop ? { paddingBottom: 12 } : undefined}>
            {nextStop ? <NextStopCard place={nextStop} /> : null}
          </View>

          <View style={{ paddingVertical: 6, backgroundColor: "rgba(9,9,11,0.9)" }}>
            <RouteBar
              stops={stops}
              activeKey={activeKey ?? stops[0]?.key ?? null}
              onSelect={scrollToStop}
              onEdit={() => setShowStationList(true)}
            />
          </View>

          {/* Spine: one rail drawn behind every station, so a single train
              runs the whole line instead of one pulse restarting per stop. */}
          <View
            className="relative"
            onLayout={(e) => {
              setSpineHeight(e.nativeEvent.layout.height);
              // Station offsets below are measured inside this wrapper, so
              // scrollToStop has to add the wrapper's own offset back on.
              spineY.current = e.nativeEvent.layout.y;
            }}
          >
            <SpineRail height={spineHeight} />

            {hubs.map((hub, hubIndex) => {
              const key = String(hub.id);
              return (
                <View
                  key={hub.id}
                  onLayout={(e) => {
                    offsets.current[key] = e.nativeEvent.layout.y;
                  }}
                >
                  <StationSection
                    label={hub.name}
                    places={byHub[key] ?? []}
                    onRevisit={incrementRevisit}
                    onUndoRevisit={decrementRevisit}
                    sectionIndex={hubIndex}
                    lineColor={getLineColor(hubIndex)}
                    collapsed={collapsed.has(key)}
                    onToggle={() => toggleCollapsed(key)}
                  />
                </View>
              );
            })}

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
                  collapsed={collapsed.has(UNSORTED_KEY)}
                  onToggle={() => toggleCollapsed(UNSORTED_KEY)}
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
