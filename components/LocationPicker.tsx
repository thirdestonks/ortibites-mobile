import { useCallback, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import MapPicker from "./MapPicker";
import { mono } from "./receipt";
import { useGuardedPush } from "../utils/navigation";
import { useLocationPickerStore } from "../stores/locationPickerStore";

interface LocationPickerProps {
  address: string;
  latitude: number | null;
  longitude: number | null;
  onAddressChange: (text: string) => void;
  onCoordsChange: (lat: number | null, lng: number | null) => void;
}

/**
 * Compact location card for forms. The real map lives on its own full-screen
 * route (/pick-location) so it never fights the form's scroll gesture; this
 * card just previews the result and opens the picker.
 */
export default function LocationPicker({
  address,
  latitude,
  longitude,
  onAddressChange,
  onCoordsChange,
}: LocationPickerProps) {
  const push = useGuardedPush();
  const openPicker = useLocationPickerStore((s) => s.open);
  const consume = useLocationPickerStore((s) => s.consume);

  // Callers pass fresh inline handlers every render; the focus effect reads the
  // latest through a ref so it only re-runs on an actual refocus.
  const latest = useRef({ onAddressChange, onCoordsChange });
  latest.current = { onAddressChange, onCoordsChange };

  // Back from the picker: take whatever it confirmed (once).
  useFocusEffect(
    useCallback(() => {
      const picked = consume();
      if (!picked) return;
      latest.current.onCoordsChange(picked.lat, picked.lng);
      latest.current.onAddressChange(picked.address);
    }, [consume])
  );

  const open = () => {
    openPicker({ lat: latitude, lng: longitude, address });
    push("/pick-location");
  };

  const hasPin = latitude != null && longitude != null;

  if (!hasPin) {
    return (
      <Pressable
        onPress={open}
        className="items-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 px-4 py-6"
      >
        <Ionicons name="map-outline" size={26} color="#fbbf24" />
        <Text style={mono} className="mt-2 text-xs font-bold uppercase tracking-widest text-zinc-200">
          Pin it on the map
        </Text>
        <Text style={mono} className="mt-1 text-center text-[10px] text-zinc-500" numberOfLines={2}>
          {address || "Search a place or drop a pin"}
        </Text>
      </Pressable>
    );
  }

  return (
    <View className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      {/* A still picture: touches fall through so the form keeps scrolling. */}
      <View style={{ height: 150 }} pointerEvents="none">
        <MapPicker latitude={latitude} longitude={longitude} interactive={false} />
      </View>

      <View className="p-3.5">
        <Text className="text-[13px] font-semibold leading-5 text-zinc-100" numberOfLines={2}>
          {address || "Pinned location"}
        </Text>
        <Text style={mono} className="mt-1 text-[10px] text-zinc-500">
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </Text>

        <View className="mt-3 flex-row gap-2">
          <Pressable
            onPress={open}
            className="h-10 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-amber-400/60"
          >
            <Ionicons name="pin" size={14} color="#fbbf24" />
            <Text style={mono} className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
              Change location
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onCoordsChange(null, null)}
            hitSlop={6}
            className="h-10 w-10 items-center justify-center rounded-xl border border-zinc-700"
          >
            <Ionicons name="close" size={16} color="#a1a1aa" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
