import React, { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { FadeIn } from "react-native-reanimated";
import Animated from "../../utils/animatedInterop";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenWrapper from "../../components/ScreenWrapper";
import SpinningWheel, { WheelItem } from "../../components/SpinningWheel";
import WheelSetupSheet from "../../components/WheelSetupSheet";
import MascotSays from "../../components/MascotSays";
import { mono } from "../../components/receipt";
import { usePlacesStore } from "../../stores/placesStore";
import { useHubsStore } from "../../stores/hubsStore";
import { useGuardedPush } from "../../utils/navigation";
import { getLineColor, UNSORTED_LINE_COLOR } from "../../utils/lineColors";
import type { Place } from "../../types/place";

const WHEEL_MAX = 360;
const COMPACT_RATIO = 0.74;

export default function RouletteScreen() {
  const places = usePlacesStore((s) => s.places);
  const fetchPlaces = usePlacesStore((s) => s.fetchPlaces);
  const hubs = useHubsStore((s) => s.hubs);
  const fetchHubs = useHubsStore((s) => s.fetchHubs);
  const push = useGuardedPush();
  const { width } = useWindowDimensions();
  // Edge to edge: the wheel is the screen, so it takes nearly the full width.
  const wheelFull = Math.min(width - 24, WHEEL_MAX);
  const wheelCompact = Math.round(wheelFull * COMPACT_RATIO);

  const [selectedSpotIds, setSelectedSpotIds] = useState<Set<number>>(new Set());
  const [manualItems, setManualItems] = useState<{ id: string; label: string }[]>([]);
  const [winner, setWinner] = useState<WheelItem | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const manualSeq = useRef(0);

  useFocusEffect(
    useCallback(() => {
      // Wheel is already built from cached places; refresh behind it.
      fetchPlaces({ quiet: true });
      fetchHubs();
    }, [fetchPlaces, fetchHubs])
  );

  // A spot's slice takes its station's line colour, so the wheel and the metro
  // screen read as the same system.
  const lineFor = useCallback(
    (place: Place) => {
      if (place.hub_id == null) return UNSORTED_LINE_COLOR;
      const i = hubs.findIndex((h) => h.id === place.hub_id);
      return i >= 0 ? getLineColor(i) : UNSORTED_LINE_COLOR;
    },
    [hubs]
  );

  const items: WheelItem[] = useMemo(() => {
    const spotItems: WheelItem[] = places
      .filter((p) => selectedSpotIds.has(p.id))
      .map((p) => {
        const line = lineFor(p);
        return {
          id: `spot-${p.id}`,
          label: p.name,
          placeId: p.id,
          color: line.bg,
          ink: line.ink,
        };
      });
    const custom: WheelItem[] = manualItems.map((m) => ({ id: m.id, label: m.label }));
    return [...spotItems, ...custom];
  }, [places, selectedSpotIds, manualItems, lineFor]);

  const clearWinner = () => setWinner(null);

  const addManual = (label: string) => {
    manualSeq.current += 1;
    setManualItems((prev) => [...prev, { id: `manual-${manualSeq.current}`, label }]);
    clearWinner();
  };

  const removeManual = (id: string) => {
    setManualItems((prev) => prev.filter((m) => m.id !== id));
    clearWinner();
  };

  const toggleSpot = (id: number) => {
    clearWinner();
    setSelectedSpotIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectMany = (ids: number[]) => {
    clearWinner();
    setSelectedSpotIds(new Set(ids));
  };

  /** Quick fills: the wheel is only useful if loading it is one tap. */
  const quickFill = (kind: "top" | "new" | "surprise" | "all") => {
    clearWinner();
    let pool = places;
    if (kind === "top") pool = places.filter((p) => (p.rating ?? 0) >= 4);
    if (kind === "new") pool = places.filter((p) => (p.revisit_count ?? 0) === 0);
    if (kind === "surprise") pool = [...places].sort(() => Math.random() - 0.5).slice(0, 5);
    setSelectedSpotIds(new Set(pool.map((p) => p.id)));
  };

  /** Drops the loser off the wheel, so rerolling converges instead of looping. */
  const rejectWinner = () => {
    if (!winner) return;
    if (winner.placeId != null) {
      setSelectedSpotIds((prev) => {
        const next = new Set(prev);
        next.delete(winner.placeId as number);
        return next;
      });
    } else {
      setManualItems((prev) => prev.filter((m) => m.id !== winner.id));
    }
    clearWinner();
  };

  const winnerPlace =
    winner?.placeId != null ? places.find((p) => p.id === winner.placeId) ?? null : null;
  const winnerLine = winnerPlace ? lineFor(winnerPlace) : null;
  const winnerHub =
    winnerPlace?.hub_id != null
      ? hubs.find((h) => h.id === winnerPlace.hub_id)?.name ?? "UNSORTED"
      : "UNSORTED";

  const canSpin = items.length >= 2;

  const mascot: { pose: "thinking" | "happy" | "explorer"; line: string } = winner
    ? { pose: "happy", line: "tara na, gutom na ako!" }
    : spinning
    ? { pose: "thinking", line: "hmmm…" }
    : canSpin
    ? { pose: "thinking", line: "gutom na ako, spin mo na" }
    : { pose: "explorer", line: "pumili muna tayo ng options" };

  return (
    <ScreenWrapper scroll>
      {/* HEADER */}
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-2xl font-extrabold uppercase tracking-widest text-zinc-100">
            Decide for me
          </Text>
          <Text
            style={mono}
            className="mt-0.5 text-[9px] uppercase tracking-[.2em] text-amber-400/80"
          >
            {items.length} on the wheel
          </Text>
        </View>
      </View>

      {/* WHEEL — the reason the screen exists, so nothing sits above it */}
      <View className="mt-5 items-center">
        <SpinningWheel
          items={items}
          size={winner ? wheelCompact : wheelFull}
          compact={!!winner}
          winnerId={winner?.id ?? null}
          onSpinStart={() => {
            setSpinning(true);
            clearWinner();
          }}
          onResult={(i) => {
            setSpinning(false);
            setWinner(items[i] ?? null);
          }}
        />
      </View>

      {/* MAY — same poses as before, now with something to say */}
      <View className="mt-4">
        <MascotSays pose={mascot.pose} line={mascot.line} size={winner ? 84 : 104} />
      </View>

      {/* DRAWER — everything that isn't the wheel lives in one sheet below it */}
      <View className="-mx-5 mt-3 rounded-t-3xl border-t border-zinc-800 bg-zinc-950/95 px-5 pb-6 pt-3">
        <View className="mb-3 h-1 w-10 self-center rounded-full bg-zinc-700" />

        {winner ? (
          <Animated.View entering={FadeIn.duration(260)}>
            {/* The result, printed in its station colour like a boarding pass */}
            <View
              className="rounded-2xl px-4 py-3.5"
              style={{ backgroundColor: winnerLine ? winnerLine.bg : "#fbbf24" }}
            >
              <Text
                style={[mono, { color: winnerLine ? winnerLine.inkMuted : "#451a03" }]}
                className="text-[8.5px] font-bold uppercase tracking-[.24em]"
              >
                Now boarding
              </Text>
              <Text
                style={[mono, { color: winnerLine ? winnerLine.ink : "#18181b" }]}
                className="mt-1.5 text-2xl font-black uppercase tracking-wide"
              >
                {winner.label}
              </Text>
              <Text
                style={[mono, { color: winnerLine ? winnerLine.inkMuted : "#451a03" }]}
                className="mt-1.5 text-[10px] uppercase"
              >
                {winnerPlace
                  ? `${winnerHub} · ${"★".repeat(Math.round(winnerPlace.rating ?? 0)) || "unrated"} · ${winnerPlace.revisit_count ?? 0} visits`
                  : "custom option"}
              </Text>
            </View>

            <View className="mt-3 gap-2">
              {winner.placeId != null && (
                <Pressable
                  onPress={() => push(`/place/${winner.placeId}`)}
                  className="h-12 flex-row items-center justify-center gap-2 rounded-xl bg-amber-400"
                >
                  <Ionicons name="navigate" size={15} color="#000" />
                  <Text
                    style={mono}
                    className="text-sm font-bold uppercase tracking-widest text-black"
                  >
                    Take me there
                  </Text>
                </Pressable>
              )}
              <View className="flex-row gap-2">
                <Pressable
                  onPress={clearWinner}
                  className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-amber-400 bg-amber-400/10"
                >
                  <Ionicons name="reload" size={15} color="#fbbf24" />
                  <Text
                    style={mono}
                    className="text-xs font-bold uppercase tracking-widest text-amber-400"
                  >
                    Spin again
                  </Text>
                </Pressable>
                <Pressable
                  onPress={rejectWinner}
                  className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-red-500 bg-red-500/10"
                >
                  <Ionicons name="close" size={17} color="#f87171" />
                  <Text
                    style={mono}
                    className="text-xs font-bold uppercase tracking-widest text-red-400"
                  >
                    Not this
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        ) : (
          <>
            {/* ON THE WHEEL — chips scroll sideways instead of wrapping into a wall */}
            <View className="mb-2.5 flex-row items-center justify-between">
              <Text
                style={mono}
                className="text-[9px] uppercase tracking-[.22em] text-zinc-500"
              >
                On the wheel
              </Text>
              <Pressable
                onPress={() => setSetupOpen(true)}
                className="rounded-full border border-amber-400/40 px-3 py-1"
              >
                <Text
                  style={mono}
                  className="text-[9px] font-bold uppercase tracking-widest text-amber-400"
                >
                  Edit list
                </Text>
              </Pressable>
            </View>

            {items.length === 0 ? (
              <Text style={mono} className="text-[11px] text-zinc-600">
                nothing loaded, use quick fill below
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="-mx-5"
                contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
              >
                {items.map((it) => (
                  <View
                    key={it.id}
                    className="rounded-lg px-3 py-1.5"
                    style={{ backgroundColor: it.color ?? "#3f3f46" }}
                  >
                    <Text
                      style={[mono, { color: it.ink ?? "#fafafa" }]}
                      className="text-[11px] font-bold"
                    >
                      {it.label}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* QUICK FILL — one tap loads the wheel */}
            <Text
              style={mono}
              className="mb-2.5 mt-5 text-[9px] uppercase tracking-[.22em] text-zinc-500"
            >
              Quick fill
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-5"
              contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
            >
              {(
                [
                  { key: "top", label: "★ 4+ only" },
                  { key: "new", label: "Never been" },
                  { key: "surprise", label: "Surprise me" },
                  { key: "all", label: "Everything" },
                ] as const
              ).map((q) => (
                <Pressable
                  key={q.key}
                  onPress={() => quickFill(q.key)}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2"
                >
                  <Text style={mono} className="text-[11px] font-bold text-zinc-300">
                    {q.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}
      </View>

      <WheelSetupSheet
        visible={setupOpen}
        onClose={() => setSetupOpen(false)}
        places={places}
        colorFor={(p) => lineFor(p).bg}
        selected={selectedSpotIds}
        onToggle={toggleSpot}
        onSelectMany={selectMany}
        manualItems={manualItems}
        onAddManual={addManual}
        onRemoveManual={removeManual}
      />
    </ScreenWrapper>
  );
}
