import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { useHubsStore } from "../stores/hubsStore";

import { showErrorToast } from "./Toast";
import { mono } from "./receipt";

type Props = {
  value: number | null;
  onChange: (hubId: number | null) => void;
};

export default function HubPicker({ value, onChange }: Props) {
  const hubs = useHubsStore((s) => s.hubs);
  const fetchHubs = useHubsStore((s) => s.fetchHubs);
  const createHub = useHubsStore((s) => s.createHub);

  const [newHubName, setNewHubName] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    fetchHubs();
  }, []);

  const handleCreateHub = async () => {
    const { hub, error } = await createHub(newHubName);
    if (error) {
      showErrorToast("Error", error);
      return;
    }
    if (hub) {
      onChange(hub.id);
      setNewHubName("");
    }
  };

  return (
    <>
      <View className="mb-2 flex-row items-center gap-2">
        <Text style={mono} className="text-xs font-bold uppercase text-amber-400">
          Station
        </Text>
        <Pressable
          onPress={() => setShowInfo((v) => !v)}
          hitSlop={8}
          className="h-4 w-4 items-center justify-center rounded-full border border-amber-400/70"
        >
          <Text style={mono} className="text-[9px] font-bold text-amber-400">
            i
          </Text>
        </Pressable>
      </View>

      {showInfo && (
        <View className="mb-3 rounded-xl border border-amber-400/30 bg-amber-400/5 px-3 py-2">
          <Text style={mono} className="text-[11px] leading-4 text-zinc-300">
            Places are grouped by their nearest train station on your home
            screen — like sorting your food map by MRT/LRT line. Optional.
          </Text>
        </View>
      )}

      <View className="flex-row flex-wrap gap-2">
        {hubs.map((h) => (
          <Pressable
            key={h.id}
            onPress={() => onChange(h.id)}
            className={`rounded-full border px-4 py-2 ${
              value === h.id
                ? "border-amber-400 bg-amber-400/20"
                : "border-zinc-800 bg-zinc-950"
            }`}
          >
            <Text style={mono} className="text-xs font-bold uppercase text-amber-400">
              {h.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="mt-3 flex-row gap-2">
        <TextInput
          value={newHubName}
          onChangeText={setNewHubName}
          placeholder="+ New station"
          placeholderTextColor="#71717a"
          className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-white"
        />
        <Pressable
          onPress={handleCreateHub}
          className="items-center justify-center rounded-2xl bg-amber-400 px-5"
        >
          <Text className="text-lg font-black text-black">+</Text>
        </Pressable>
      </View>
    </>
  );
}
