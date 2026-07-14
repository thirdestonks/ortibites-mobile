import { useEffect, useRef } from "react";
import { View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { buildMapHtml } from "./mapPickerHtml";

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

const ORTIGAS = { lat: 14.5866, lng: 121.063 };
const ZOOM = 15;
const EPSILON = 1e-6;
const SIZE = 220;

export default function MapPicker({ latitude, longitude, onChange }: MapPickerProps) {
  const webRef = useRef<WebView>(null);
  // Last center the map itself reported — used to avoid a recenter feedback loop.
  const lastReported = useRef<{ lat: number; lng: number } | null>(null);

  const initialLat = latitude ?? ORTIGAS.lat;
  const initialLng = longitude ?? ORTIGAS.lng;

  const html = buildMapHtml(initialLat, initialLng, ZOOM);

  useEffect(() => {
    if (latitude == null || longitude == null) return;
    const last = lastReported.current;
    // Only recenter when the incoming coords did NOT originate from the map's own move.
    if (
      last &&
      Math.abs(last.lat - latitude) < EPSILON &&
      Math.abs(last.lng - longitude) < EPSILON
    ) {
      return;
    }
    webRef.current?.injectJavaScript(
      `window.recenter && window.recenter(${latitude}, ${longitude}); true;`
    );
  }, [latitude, longitude]);

  const handleMessage = (e: WebViewMessageEvent) => {
    try {
      const { lat, lng } = JSON.parse(e.nativeEvent.data);
      if (typeof lat === "number" && typeof lng === "number") {
        lastReported.current = { lat, lng };
        onChange(lat, lng);
      }
    } catch {
      // ignore malformed messages
    }
  };

  return (
    <View
      style={{
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE / 2,
        overflow: "hidden",
        alignSelf: "center",
      }}
      className="border-2 border-amber-500 bg-zinc-950"
    >
      <WebView
        ref={webRef}
        source={{ html }}
        originWhitelist={["*"]}
        onMessage={handleMessage}
        javaScriptEnabled
        scrollEnabled={false}
        style={{ backgroundColor: "#09090b" }}
      />
    </View>
  );
}
