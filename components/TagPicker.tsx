import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { mono } from "./receipt";

type Tone = "pro" | "con" | "dish";

const TONES: Record<Tone, { on: string; onText: string; label: string }> = {
  pro: { on: "bg-green-400", onText: "text-black", label: "text-green-400" },
  con: { on: "bg-red-400", onText: "text-black", label: "text-red-400" },
  dish: { on: "bg-orange-400", onText: "text-black", label: "text-orange-400" },
};

type Props = {
  label: string;
  tone: Tone;
  presets: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

/**
 * Tap-to-toggle chips over a preset list, with a text field for anything not
 * on it. Replaces the old type -> press "+" -> repeat loop, which cost three
 * interactions per item.
 */
export default function TagPicker({
  label,
  tone,
  presets,
  value,
  onChange,
  placeholder = "Add your own…",
}: Props) {
  const [draft, setDraft] = useState("");
  const t = TONES[tone];

  const toggle = (tag: string) =>
    onChange(value.includes(tag) ? value.filter((v) => v !== tag) : [...value, tag]);

  const addCustom = () => {
    const trimmed = draft.trim();
    if (!trimmed || value.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  };

  // Anything selected that isn't a preset — shown first so custom tags don't
  // get lost at the end of a long list.
  const custom = value.filter((v) => !presets.includes(v));

  return (
    <View>
      <Text style={mono} className={`mb-2.5 text-xs font-bold uppercase ${t.label}`}>
        {label}
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {custom.map((tag) => (
          <Pressable
            key={tag}
            onPress={() => toggle(tag)}
            className={`rounded-xl px-3 py-2 ${t.on}`}
          >
            <Text style={mono} className={`text-[11px] font-bold ${t.onText}`}>
              {tag} ✕
            </Text>
          </Pressable>
        ))}

        {presets.map((tag) => {
          const on = value.includes(tag);
          return (
            <Pressable
              key={tag}
              onPress={() => toggle(tag)}
              className={`rounded-xl px-3 py-2 ${
                on ? t.on : "border border-zinc-800 bg-zinc-950"
              }`}
            >
              <Text
                style={mono}
                className={`text-[11px] font-bold ${on ? t.onText : "text-zinc-400"}`}
              >
                {tag}
                {on ? " ✓" : ""}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-3 flex-row gap-2">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addCustom}
          returnKeyType="done"
          placeholder={placeholder}
          placeholderTextColor="#52525b"
          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white"
        />
        <Pressable
          onPress={addCustom}
          className="items-center justify-center rounded-xl border border-zinc-700 px-4"
        >
          <Text className="text-lg font-black text-zinc-300">+</Text>
        </Pressable>
      </View>
    </View>
  );
}
