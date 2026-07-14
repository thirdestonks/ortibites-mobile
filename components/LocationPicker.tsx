import { useRef } from "react";
import { View } from "react-native";

import MapPicker from "./MapPicker";
import AddressAutocomplete, { formatPhotonAddress } from "./AddressAutocomplete";

interface LocationPickerProps {
  address: string;
  latitude: number | null;
  longitude: number | null;
  onAddressChange: (text: string) => void;
  onCoordsChange: (lat: number, lng: number) => void;
}

const PHOTON_REVERSE = "https://photon.komoot.io/reverse";

export default function LocationPicker({
  address,
  latitude,
  longitude,
  onAddressChange,
  onCoordsChange,
}: LocationPickerProps) {
  const reverseId = useRef(0);

  const reverseGeocode = async (lat: number, lng: number) => {
    const id = ++reverseId.current;
    try {
      const res = await fetch(`${PHOTON_REVERSE}?lat=${lat}&lon=${lng}&lang=en`);
      const data = await res.json();
      if (id !== reverseId.current) return; // superseded by a newer pan
      const feature = data.features?.[0];
      if (feature) {
        const formatted = formatPhotonAddress(feature.properties);
        if (formatted) onAddressChange(formatted);
      }
    } catch {
      // silent — keep the panned coords, leave the address as-is
    }
  };

  // Map moved: capture coords, then reverse-geocode to refresh the address.
  const handleMapChange = (lat: number, lng: number) => {
    onCoordsChange(lat, lng);
    reverseGeocode(lat, lng);
  };

  // Suggestion picked: coords flow into the map (recenters via prop).
  const handlePick = (
    _addr: string,
    coords: { lat: number; lng: number } | null
  ) => {
    if (coords) onCoordsChange(coords.lat, coords.lng);
  };

  return (
    <View className="gap-3">
      <MapPicker latitude={latitude} longitude={longitude} onChange={handleMapChange} />
      <AddressAutocomplete
        value={address}
        onChangeText={onAddressChange}
        onPick={handlePick}
        placeholder="Input place"
      />
    </View>
  );
}
