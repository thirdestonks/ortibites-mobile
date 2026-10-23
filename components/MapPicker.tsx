import { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { buildMapHtml, type MapMarker } from "./mapPickerHtml";

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  /** Called when the user drags the map. Omit for a display-only map. */
  onChange?: (lat: number, lng: number) => void;
  /** false = still picture (no pan/zoom) so it can sit inside a scrolling screen. */
  interactive?: boolean;
  markers?: MapMarker[];
  zoom?: number;
}

const ORTIGAS = { lat: 14.5866, lng: 121.063 };
const EPSILON = 1e-6;

/** Fills its parent. The pin is fixed at the centre; the map moves under it. */
export default function MapPicker({
  latitude,
  longitude,
  onChange,
  interactive = true,
  markers,
  zoom = 16,
}: MapPickerProps) {
  // react-native-webview 14 defaults its generic to `undefined`, which makes
  // the props type collapse to `never`; pinning it to `object` fixes the JSX.
  const webRef = useRef<WebView<object>>(null);
  // Last center the map itself reported — used to avoid a recenter feedback loop.
  const lastReported = useRef<{ lat: number; lng: number } | null>(null);

  // Frozen at mount. Rebuilding the HTML as the pin moves would reload the
  // WebView on every pan; later coordinate changes go in through recenter().
  const start = useRef({
    lat: latitude ?? ORTIGAS.lat,
    lng: longitude ?? ORTIGAS.lng,
  });

  const markersKey = JSON.stringify(markers ?? []);
  const html = useMemo(
    () =>
      buildMapHtml({
        lat: start.current.lat,
        lng: start.current.lng,
        zoom,
        interactive,
        markers,
      }),
    // markersKey is the value-equal stand-in for the markers array
    [zoom, interactive, markersKey]
  );

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
        onChange?.(lat, lng);
      }
    } catch {
      // ignore malformed messages
    }
  };

  return (
    <View className="flex-1 bg-zinc-950">
      <WebView<object>
        ref={webRef}
        // baseUrl makes the WebView send a Referer with every tile request,
        // which OpenStreetMap's servers require.
        source={{ html, baseUrl: "https://ortibites.app" }}
        originWhitelist={["*"]}
        onMessage={handleMessage}
        javaScriptEnabled
        scrollEnabled={false}
        style={{ backgroundColor: "#17140f" }}
      />
    </View>
  );
}
