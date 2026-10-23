import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MapPicker from "../../components/MapPicker";
import AddressAutocomplete, {
  formatPhotonAddress,
} from "../../components/AddressAutocomplete";
import { mono } from "../../components/receipt";
import { useLocationPickerStore } from "../../stores/locationPickerStore";

const ORTIGAS = { lat: 14.5866, lng: 121.063 };
const PHOTON_REVERSE = "https://photon.komoot.io/reverse";

/** Full-screen map: drag under a fixed pin, or search, then confirm. */
export default function PickLocationScreen() {
  const insets = useSafeAreaInsets();
  const initial = useLocationPickerStore((s) => s.initial);
  const confirm = useLocationPickerStore((s) => s.confirm);

  const [coords, setCoords] = useState({
    lat: initial.lat ?? ORTIGAS.lat,
    lng: initial.lng ?? ORTIGAS.lng,
  });
  // `address` is the search bar's text (editable); `pinAddress` is what the
  // pin currently resolves to.
  const [address, setAddress] = useState(initial.address);
  const [pinAddress, setPinAddress] = useState(initial.address);
  const [manual, setManual] = useState(false);
  const [resolving, setResolving] = useState(false);

  const manualRef = useRef(false);
  const reverseId = useRef(0);

  const setManualBoth = (value: boolean) => {
    manualRef.current = value;
    setManual(value);
  };

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    const id = ++reverseId.current;
    setResolving(true);
    try {
      const res = await fetch(`${PHOTON_REVERSE}?lat=${lat}&lon=${lng}&lang=en`);
      const data = await res.json();
      if (id !== reverseId.current) return; // superseded by a newer pan
      const feature = data.features?.[0];
      const text = feature ? formatPhotonAddress(feature.properties) : "";
      setPinAddress(text);
      // An address the user typed by hand is never overwritten by the pin.
      if (text && !manualRef.current) setAddress(text);
    } catch {
      // silent: keep the coords, leave the address as-is
    } finally {
      if (id === reverseId.current) setResolving(false);
    }
  }, []);

  // Opening with no address yet (new spot): name the default pin.
  useEffect(() => {
    if (!initial.address) reverseGeocode(coords.lat, coords.lng);
  }, []);

  const handleMapChange = (lat: number, lng: number) => {
    setCoords({ lat, lng });
    reverseGeocode(lat, lng);
  };

  // AddressAutocomplete calls onChangeText for typing and for picking a
  // suggestion; onPick fires right after a pick and flips manual back off.
  const handleType = (text: string) => {
    setAddress(text);
    setManualBoth(true);
  };

  const handlePick = (
    picked: string,
    pickedCoords: { lat: number; lng: number } | null
  ) => {
    reverseId.current++; // drop any in-flight reverse lookup
    setResolving(false);
    setPinAddress(picked);
    setManualBoth(false);
    if (pickedCoords) setCoords(pickedCoords);
    Keyboard.dismiss();
  };

  const applyPinAddress = () => {
    setManualBoth(false);
    if (pinAddress) setAddress(pinAddress);
  };

  const onConfirm = () => {
    const finalAddress = (manual ? address : pinAddress || address).trim();
    confirm({ lat: coords.lat, lng: coords.lng, address: finalAddress });
    router.back();
  };

  return (
    <View className="flex-1 bg-zinc-950">
      <View className="absolute inset-0">
        <MapPicker
          latitude={coords.lat}
          longitude={coords.lng}
          onChange={handleMapChange}
          zoom={17}
        />
      </View>

      {/* TOP: back + search */}
      <View
        className="absolute left-3 right-3 flex-row items-start gap-2"
        style={{ top: insets.top + 10 }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={6}
          className="h-[58px] w-12 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-950/90"
        >
          <Ionicons name="chevron-back" size={20} color="#d4d4d8" />
        </Pressable>
        <View className="flex-1">
          <AddressAutocomplete
            value={address}
            onChangeText={handleType}
            onPick={handlePick}
            placeholder="Search a place or address"
          />
        </View>
      </View>

      {/* BOTTOM: pinned address + confirm */}
      <View
        className="absolute bottom-0 left-0 right-0 rounded-t-3xl border-t border-amber-400/40 bg-zinc-950/95 px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="mb-3 h-1 w-10 self-center rounded-full bg-zinc-700" />

        <Text style={mono} className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-400">
          Pinned here
        </Text>

        <View className="mt-1.5 min-h-[40px] flex-row items-start gap-2">
          {resolving ? (
            <ActivityIndicator size="small" color="#fbbf24" style={{ marginTop: 2 }} />
          ) : (
            <Ionicons name="location" size={16} color="#fbbf24" style={{ marginTop: 2 }} />
          )}
          <Text className="flex-1 text-[14px] font-bold leading-5 text-white" numberOfLines={2}>
            {pinAddress || "Unnamed spot"}
          </Text>
        </View>

        <Text style={mono} className="mt-1 text-[10px] text-zinc-500">
          {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </Text>

        {manual && pinAddress ? (
          <Text style={mono} className="mt-2 text-[10px] text-amber-400">
            Saving the address you typed ·{" "}
            <Text onPress={applyPinAddress} style={{ textDecorationLine: "underline" }}>
              use pin address
            </Text>
          </Text>
        ) : null}

        <Pressable
          onPress={onConfirm}
          className="mt-4 h-12 items-center justify-center rounded-xl bg-amber-400"
        >
          <Text style={mono} className="text-sm font-bold uppercase tracking-widest text-black">
            Confirm location
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
