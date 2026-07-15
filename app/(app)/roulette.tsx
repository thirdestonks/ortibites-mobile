import React, { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";

import ScreenWrapper from "../../components/ScreenWrapper";
import ScreenHeader from "../../components/ScreenHeader";
import AppButton from "../../components/AppButton";
import SpinningWheel, { WheelItem } from "../../components/SpinningWheel";
import { usePlacesStore } from "../../stores/placesStore";
import { useGuardedPush } from "../../utils/navigation";

export default function RouletteScreen() {
  const places = usePlacesStore((s) => s.places);
  const fetchPlaces = usePlacesStore((s) => s.fetchPlaces);
  const push = useGuardedPush();

  const [selectedSpotIds, setSelectedSpotIds] = useState<Set<number>>(new Set());
  const [manualItems, setManualItems] = useState<{ id: string; label: string }[]>([]);
  const [text, setText] = useState("");
  const [winner, setWinner] = useState<WheelItem | null>(null);
  const [spinning, setSpinning] = useState(false);
  const manualSeq = useRef(0);

  useFocusEffect(
    useCallback(() => {
      fetchPlaces();
    }, [fetchPlaces])
  );

  const items: WheelItem[] = useMemo(() => {
    const spotItems: WheelItem[] = places
      .filter((p) => selectedSpotIds.has(p.id))
      .map((p) => ({ id: `spot-${p.id}`, label: p.name, placeId: p.id }));
    const custom: WheelItem[] = manualItems.map((m) => ({ id: m.id, label: m.label }));
    return [...spotItems, ...custom];
  }, [places, selectedSpotIds, manualItems]);

  const addManual = () => {
    if (spinning) return;
    const label = text.trim();
    if (!label) return;
    manualSeq.current += 1;
    setManualItems((prev) => [...prev, { id: `manual-${manualSeq.current}`, label }]);
    setText("");
    setWinner(null);
  };

  const removeManual = (id: string) => {
    if (spinning) return;
    setManualItems((prev) => prev.filter((m) => m.id !== id));
    setWinner(null);
  };

  const toggleSpot = (id: number) => {
    if (spinning) return;
    setWinner(null);
    setSelectedSpotIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canSpin = items.length >= 2;

  return (
    <ScreenWrapper scroll>
      <ScreenHeader title="ROULETTE" subtitle="tap the wheel 🎡" />

      {/* WHEEL */}
      <View className="items-center py-4">
        <SpinningWheel
          items={items}
          onSpinStart={() => {
            setSpinning(true);
            setWinner(null);
          }}
          onResult={(i) => {
            setSpinning(false);
            setWinner(items[i] ?? null);
          }}
        />
        <Text className="mt-6 text-center text-zinc-400">
          {canSpin ? "tap the wheel to spin" : "add at least 2 options to spin"}
        </Text>
      </View>

      {/* WINNER */}
      {winner ? (
        <View className="mb-6 items-center">
          <Text className="mb-2 text-center text-2xl font-black uppercase tracking-widest text-amber-400">
            🎉 {winner.label}
          </Text>
          {winner.placeId ? (
            <AppButton
              title="TAKE ME THERE"
              onPress={() => push(`/place/${winner.placeId}`)}
            />
          ) : null}
        </View>
      ) : null}

      {/* MANUAL INPUT */}
      <View className="mb-4 flex-row items-center gap-2">
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={addManual}
          editable={!spinning}
          placeholder="type an option…"
          placeholderTextColor="#71717a"
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white"
        />
        <Pressable onPress={addManual} disabled={spinning} className="rounded-xl bg-amber-400 px-5 py-3">
          <Text className="font-black text-black">ADD</Text>
        </Pressable>
      </View>

      {/* MANUAL CHIPS */}
      {manualItems.length > 0 ? (
        <View className="mb-5 flex-row flex-wrap gap-2">
          {manualItems.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => removeManual(m.id)}
              className="flex-row items-center gap-2 rounded-full border border-orange-400/60 bg-orange-400/10 px-3 py-2"
            >
              <Text className="text-sm font-bold text-amber-300">{m.label}</Text>
              <Text className="text-xs text-zinc-400">✕</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* SPOTS CHECKLIST */}
      <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
        your spots
      </Text>
      {places.length === 0 ? (
        <Text className="mb-24 text-zinc-500">
          No saved spots yet — type options above.
        </Text>
      ) : (
        <View className="mb-24">
          {places.map((p) => {
            const isSel = selectedSpotIds.has(p.id);
            return (
              <Pressable
                key={p.id}
                onPress={() => toggleSpot(p.id)}
                className={`mb-2 flex-row items-center justify-between rounded-2xl border px-4 py-4 ${
                  isSel ? "border-amber-400 bg-zinc-900" : "border-zinc-800 bg-zinc-950"
                }`}
              >
                <Text
                  className="flex-1 pr-3 text-base font-bold text-white"
                  numberOfLines={1}
                >
                  {p.name}
                </Text>
                <Text className={isSel ? "text-lg text-amber-400" : "text-lg text-zinc-600"}>
                  {isSel ? "✓" : "○"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScreenWrapper>
  );
}
