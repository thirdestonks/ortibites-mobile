import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import type { Hub } from "../types/hub";
import { showErrorToast } from "./Toast";
import { mono } from "./receipt";

type Props = {
  hub: Hub;
  onRename: (id: number, name: string) => Promise<{ error: string | null }>;
};

function NfcMark() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth={2} strokeLinecap="round">
      <Path d="M8 9a5 5 0 0 1 0 6" opacity={0.9} />
      <Path d="M11 6a9 9 0 0 1 0 12" opacity={0.6} />
      <Path d="M14 3a13 13 0 0 1 0 18" opacity={0.35} />
    </Svg>
  );
}

export default function StationTapCard({ hub, onRename }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(hub.name);
  const [saving, setSaving] = useState(false);

  const maskedCode = hub.name.replace(/\s+/g, "").slice(0, 4).toUpperCase().padEnd(4, "•");

  const startEditing = () => {
    setDraft(hub.name);
    setEditing(true);
  };

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === hub.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const { error } = await onRename(hub.id, trimmed);
    setSaving(false);
    if (error) {
      showErrorToast("Error", error);
      return;
    }
    setEditing(false);
  };

  return (
    <View className="overflow-hidden rounded-2xl border border-amber-400/30 bg-zinc-950 px-4 py-3">
      <View className="flex-row items-start justify-between">
        <Text style={mono} className="text-[9px] uppercase tracking-widest text-zinc-500">
          Ortibites &middot; Line Pass
        </Text>
        <NfcMark />
      </View>

      {editing ? (
        <TextInput
          value={draft}
          onChangeText={setDraft}
          autoFocus
          onSubmitEditing={handleSave}
          placeholder="Station name"
          placeholderTextColor="#71717a"
          className="mt-2 rounded-lg border border-amber-400 bg-amber-400/10 px-2 py-1 text-base font-extrabold uppercase tracking-wide text-amber-100"
        />
      ) : (
        <Text style={mono} className="mt-2 text-base font-extrabold uppercase tracking-wide text-amber-100">
          {hub.name}
        </Text>
      )}

      <View className="mt-3 flex-row items-center justify-between">
        <Text style={mono} className="text-[10px] tracking-widest text-zinc-500">
          •••• •••• <Text className="font-bold text-amber-400">{maskedCode}</Text>
        </Text>
        {editing ? (
          <Pressable
            onPress={handleSave}
            disabled={saving}
            className="rounded-md border border-amber-400/70 bg-amber-400/10 px-2 py-1"
          >
            <Text style={mono} className="text-[10px] font-bold uppercase text-amber-400">
              {saving ? "Saving…" : "Save"}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={startEditing}
            hitSlop={6}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1"
          >
            <Text style={mono} className="text-[10px] font-bold uppercase text-zinc-300">
              Edit
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
