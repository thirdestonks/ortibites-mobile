import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";

import type { Place } from "../types/place";
import { mono } from "./receipt";

type Filter = "all" | "top" | "new";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "top", label: "★ 4+" },
  { key: "new", label: "Never been" },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  places: Place[];
  /** Line colour per place id, so a row matches its slice on the wheel. */
  colorFor: (place: Place) => string;
  selected: Set<number>;
  onToggle: (id: number) => void;
  onSelectMany: (ids: number[]) => void;
  manualItems: { id: string; label: string }[];
  onAddManual: (label: string) => void;
  onRemoveManual: (id: string) => void;
};

function stars(rating: number | null | undefined): string {
  const n = Math.round(rating ?? 0);
  if (n <= 0) return "unrated";
  return "★".repeat(n) + "☆".repeat(5 - n);
}

/**
 * Picks what goes on the wheel. Lives in a sheet so the wheel stays on screen
 * behind it — curating is a chore you do once per spin, not the main event.
 */
export default function WheelSetupSheet({
  visible,
  onClose,
  places,
  colorFor,
  selected,
  onToggle,
  onSelectMany,
  manualItems,
  onAddManual,
  onRemoveManual,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [draft, setDraft] = useState("");

  const shown = useMemo(() => {
    if (filter === "top") return places.filter((p) => (p.rating ?? 0) >= 4);
    if (filter === "new") return places.filter((p) => (p.revisit_count ?? 0) === 0);
    return places;
  }, [places, filter]);

  const addManual = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAddManual(trimmed);
    setDraft("");
  };

  const total = selected.size + manualItems.length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Animated.View entering={FadeIn.duration(160)} className="absolute inset-0">
          <Pressable onPress={onClose} className="flex-1 bg-black/75" />
        </Animated.View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Animated.View
            entering={SlideInDown.duration(240)}
            className="max-h-[80%] rounded-t-3xl border-t border-zinc-800 bg-zinc-950 px-4 pb-7 pt-3"
          >
            <View className="mb-3 items-center">
              <View className="h-1 w-10 rounded-full bg-zinc-700" />
            </View>

            <View className="mb-3 flex-row items-center justify-between px-1">
              <Text
                style={mono}
                className="text-xs font-bold uppercase tracking-widest text-amber-400"
              >
                What's on the wheel
              </Text>
              <Text style={mono} className="text-[10px] text-zinc-500">
                {total} / {places.length + manualItems.length}
              </Text>
            </View>

            {/* Filters double as one-tap fills */}
            <View className="flex-row gap-2">
              {FILTERS.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  className={`rounded-full px-3 py-1.5 ${
                    filter === f.key ? "bg-amber-400" : "border border-zinc-700"
                  }`}
                >
                  <Text
                    style={mono}
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      filter === f.key ? "text-black" : "text-zinc-400"
                    }`}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => onSelectMany(shown.map((p) => p.id))}
                className="ml-auto rounded-full border border-amber-400/50 px-3 py-1.5"
              >
                <Text
                  style={mono}
                  className="text-[10px] font-bold uppercase tracking-widest text-amber-400"
                >
                  Select shown
                </Text>
              </Pressable>
            </View>

            <ScrollView
              className="mt-3"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {shown.length === 0 ? (
                <Text
                  style={mono}
                  className="py-6 text-center text-[11px] uppercase tracking-widest text-zinc-600"
                >
                  nothing matches this filter
                </Text>
              ) : (
                <View className="gap-2">
                  {shown.map((p) => {
                    const on = selected.has(p.id);
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => onToggle(p.id)}
                        className={`flex-row items-center gap-3 rounded-xl border px-3.5 py-3 ${
                          on ? "border-amber-400/50 bg-zinc-900" : "border-zinc-800 bg-zinc-950"
                        }`}
                      >
                        <View
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: on ? colorFor(p) : "#3f3f46" }}
                        />
                        <View className="flex-1">
                          <Text
                            className={`text-[13px] font-bold ${on ? "text-white" : "text-white/55"}`}
                            numberOfLines={1}
                          >
                            {p.name}
                          </Text>
                          <Text
                            style={mono}
                            className="mt-0.5 text-[9px] uppercase text-zinc-500"
                          >
                            {stars(p.rating)}
                          </Text>
                        </View>
                        <Text className={on ? "text-base text-amber-400" : "text-base text-zinc-700"}>
                          {on ? "✓" : "○"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* One-off options, kept but demoted */}
              {manualItems.length > 0 && (
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {manualItems.map((m) => (
                    <Pressable
                      key={m.id}
                      onPress={() => onRemoveManual(m.id)}
                      className="flex-row items-center gap-2 rounded-full border border-orange-400/60 bg-orange-400/10 px-3 py-2"
                    >
                      <Text className="text-xs font-bold text-amber-300">{m.label}</Text>
                      <Text className="text-[10px] text-zinc-400">✕</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <View className="mt-3 flex-row items-center gap-2 rounded-xl border border-dashed border-amber-400/40 px-3 py-2">
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  onSubmitEditing={addManual}
                  placeholder="+ Add a one-off option…"
                  placeholderTextColor="#52525b"
                  className="flex-1 text-sm text-white"
                />
                <Pressable
                  onPress={addManual}
                  className="rounded-lg bg-amber-400 px-3 py-1.5"
                >
                  <Text className="text-base font-black text-black">+</Text>
                </Pressable>
              </View>
            </ScrollView>

            <Pressable
              onPress={onClose}
              className="mt-3 h-12 items-center justify-center rounded-xl bg-amber-400"
            >
              <Text
                style={mono}
                className="text-sm font-bold uppercase tracking-widest text-black"
              >
                {total >= 2 ? `Load ${total} onto the wheel` : "Pick at least 2"}
              </Text>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
