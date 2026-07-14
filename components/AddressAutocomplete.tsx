import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { mono } from "./receipt";

interface AddressAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onPick?: (address: string, coords: { lat: number; lng: number } | null) => void;
  placeholder?: string;
}

interface PhotonProperties {
  name?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  state?: string;
  country?: string;
  countrycode?: string;
}

interface PhotonFeature {
  properties: PhotonProperties;
  geometry?: { coordinates?: [number, number] }; // [lon, lat]
}

const PHOTON_URL = "https://photon.komoot.io/api/";
// Ortigas Center — biases result ranking toward the user's area.
const ORTIGAS = { lat: 14.5866, lon: 121.063 };
// Philippines bounding box (minLon,minLat,maxLon,maxLat) — hard-restricts results.
const PH_BBOX = "116.9,4.6,126.6,21.1";

export function formatPhotonAddress(p: PhotonProperties): string {
  const street =
    p.street && p.housenumber ? `${p.street} ${p.housenumber}` : p.street;
  return [p.name, street, p.city, p.country].filter(Boolean).join(", ");
}

export default function AddressAutocomplete({
  value,
  onChangeText,
  onPick,
  placeholder = "SM Clark, Angeles, Pampanga",
}: AddressAutocompleteProps) {
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const requestId = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const search = async (query: string) => {
    const id = ++requestId.current;
    try {
      const url =
        `${PHOTON_URL}?q=${encodeURIComponent(query)}&limit=10&lang=en` +
        `&bbox=${PH_BBOX}` +
        `&lat=${ORTIGAS.lat}&lon=${ORTIGAS.lon}&location_bias_scale=0.5`;
      const res = await fetch(url);
      const data = await res.json();
      if (id !== requestId.current) return; // a newer query superseded this one
      const features: PhotonFeature[] = data.features ?? [];
      const phOnly = features
        .filter((f) => f.properties.countrycode === "PH")
        .slice(0, 5);
      setResults(phOnly);
    } catch {
      if (id !== requestId.current) return;
      setResults([]);
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setSearched(true);
      }
    }
  };

  const handleChange = (text: string) => {
    onChangeText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = text.trim();
    if (query.length < 3) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => search(query), 350);
  };

  const pick = (feature: PhotonFeature) => {
    const address = formatPhotonAddress(feature.properties);
    onChangeText(address);
    const coords = feature.geometry?.coordinates;
    if (onPick) {
      onPick(address, coords ? { lat: coords[1], lng: coords[0] } : null);
    }
    setResults([]);
    setSearched(false);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <View>
      <View className="flex-row items-center">
        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor="#71717a"
          multiline
          className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-white"
        />
        {loading && (
          <ActivityIndicator size="small" color="#fbbf24" style={{ marginLeft: 8 }} />
        )}
      </View>

      {results.length > 0 && (
        <View className="mt-2 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
          {results.map((feature, index) => (
            <Pressable
              key={index}
              onPress={() => pick(feature)}
              className="border-b border-zinc-800 px-4 py-3"
            >
              <Text style={mono} className="text-xs text-zinc-200">
                📍 {formatPhotonAddress(feature.properties)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {searched && !loading && results.length === 0 && value.trim().length >= 3 && (
        <Text style={mono} className="mt-2 px-1 text-[10px] text-zinc-500">
          No matches — keep typing or enter manually
        </Text>
      )}
    </View>
  );
}
