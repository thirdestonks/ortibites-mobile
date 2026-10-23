import { useCallback, useMemo, useState } from "react";

import { useFocusEffect, router, useLocalSearchParams } from "expo-router";
import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlacesStore } from "../../../stores/placesStore";
import { useHubsStore } from "../../../stores/hubsStore";
import { useGuardedPush } from "../../../utils/navigation";
import { getRatingMeta } from "../../../utils/rating";
import { distanceMeters, formatDistance } from "../../../utils/geo";
import {
  getLineColor,
  UNSORTED_LINE_COLOR,
  type LineColor,
} from "../../../utils/lineColors";
import type { Place } from "../../../types/place";

import { showErrorToast, showSuccessToast } from "../../../components/Toast";

import ScreenWrapper from "../../../components/ScreenWrapper";
import MapPicker from "../../../components/MapPicker";
import ReceiptSkeleton, { SkelBar } from "../../../components/ReceiptSkeleton";
import {
  mono,
  ReceiptHeader,
  ReceiptLine,
  DashDivider,
} from "../../../components/receipt";

// The map is fixed behind the scroll view. The first SPACER px of scroll
// content is transparent so the map shows through; the receipt sheet starts
// below it and slides up over the map as you scroll.
const HERO_H = 290;
const SPACER = 238;

function formatVisited(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = String(d.getFullYear()).slice(-2);
  return `${month} '${year}`.toUpperCase();
}

export default function PlaceDetailsScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const fetchPlace = usePlacesStore((s) => s.fetchPlace);
  const getCached = usePlacesStore((s) => s.getCached);
  const places = usePlacesStore((s) => s.places);
  const deletePlace = usePlacesStore((s) => s.deletePlace);
  const incrementRevisit = usePlacesStore((s) => s.incrementRevisit);
  const decrementRevisit = usePlacesStore((s) => s.decrementRevisit);

  const fetchHubs = useHubsStore((s) => s.fetchHubs);
  const hubs = useHubsStore((s) => s.hubs);

  const push = useGuardedPush();

  // You almost always arrive here from a list that already holds this place, so
  // paint from memory on the very first render and never show a spinner.
  const [place, setPlace] = useState<Place | null>(() => getCached(id as string));
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      const load = async () => {
        setRefreshing(true);
        const data = await fetchPlace(id as string);
        if (!alive) return;
        // A failed refresh keeps the cached copy on screen instead of wiping it.
        if (data) setPlace(data);
        else if (!getCached(id as string)) setNotFound(true);
        setRefreshing(false);
      };

      load();
      fetchHubs();
      return () => {
        alive = false;
      };
    }, [id])
  );

  // The user's other pinned places, nearest first. Pure maths over what the
  // store already holds, so no extra fetch.
  const around = useMemo(() => {
    if (!place || place.latitude == null || place.longitude == null) return [];
    const { latitude, longitude } = place;
    return places
      .filter((p) => p.id !== place.id && p.latitude != null && p.longitude != null)
      .map((p) => ({
        place: p,
        distance: distanceMeters(latitude, longitude, p.latitude!, p.longitude!),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 8);
  }, [places, place]);

  const lineFor = (hubId?: number | null): LineColor => {
    if (hubId == null) return UNSORTED_LINE_COLOR;
    const i = hubs.findIndex((h) => h.id === hubId);
    return i >= 0 ? getLineColor(i) : UNSORTED_LINE_COLOR;
  };

  const handleRevisit = () => {
    if (!place) return;
    incrementRevisit(place.id);
    setPlace((prev) =>
      prev ? { ...prev, revisit_count: (prev.revisit_count ?? 0) + 1 } : prev
    );
  };

  const handleUndoRevisit = () => {
    if (!place) return;
    const current = place.revisit_count ?? 0;
    if (current <= 0) return;
    decrementRevisit(place.id, current);
    setPlace((prev) =>
      prev ? { ...prev, revisit_count: Math.max(0, (prev.revisit_count ?? 0) - 1) } : prev
    );
  };

  const handleDelete = () => {
    setShowMore(false);
    Alert.alert("Delete Place", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await deletePlace(id as string);

          if (error) {
            showErrorToast("Error", error);
            return;
          }

          showSuccessToast("Success", "Place deleted");

          router.replace("/");
        },
      },
    ]);
  };

  const mapsHref =
    place?.latitude != null && place?.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`
      : place?.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${place.name} ${place.address}`
        )}`
      : null;

  const openMaps = async () => {
    if (!mapsHref) return;

    try {
      await Linking.openURL(mapsHref);
    } catch {
      Alert.alert("Error", "Cannot open maps.");
    }
  };

  // Cold open only: nothing cached and the first fetch hasn't landed.
  if (!place && !notFound) {
    return (
      <ScreenWrapper scroll>
        <ReceiptSkeleton />
      </ScreenWrapper>
    );
  }

  if (!place) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center">
          <Text className="text-white">Place not found.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const rating = place.rating ?? 0;
  const meta = getRatingMeta(rating);
  const filled = Math.round(rating);
  const visited = formatVisited(place.visited_at ?? place.created_at);
  const orderNo = `#${String(place.id).padStart(4, "0")}`;
  const revisits = place.revisit_count ?? 0;

  const hasPin = place.latitude != null && place.longitude != null;
  const line = lineFor(place.hub_id);
  const markers = around
    .slice(0, 6)
    .map((a) => ({
      lat: a.place.latitude!,
      lng: a.place.longitude!,
      color: lineFor(a.place.hub_id).bg,
    }));

  // Hubs load separately, so show a placeholder rather than a wrong "UNSORTED".
  const hubKnown = !place.hub_id || hubs.length > 0;
  const hubName = !place.hub_id
    ? "UNSORTED"
    : hubs.find((h) => h.id === place.hub_id)?.name ?? "UNSORTED";

  const editPlace = () => {
    setShowMore(false);
    push(`/edit/${id}`);
  };

  return (
    <View className="flex-1 bg-zinc-950">
      {/* MAP HERO — fixed behind everything */}
      <View className="absolute left-0 right-0 top-0" style={{ height: HERO_H }}>
        {hasPin ? (
          <MapPicker
            latitude={place.latitude!}
            longitude={place.longitude!}
            interactive={false}
            markers={markers}
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-zinc-900">
            <Ionicons name="map-outline" size={34} color="#52525b" />
            <Text style={mono} className="mt-2 text-[10px] uppercase tracking-widest text-zinc-500">
              No pin yet
            </Text>
          </View>
        )}
        {/* keeps the status bar and header buttons legible over bright tiles */}
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(0,0,0,0.6)", "transparent"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: 110 }}
        />
      </View>

      <ScrollView
        className="absolute inset-0"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 0 }}
      >
        {/* Transparent: taps on the map open directions */}
        <Pressable
          style={{ height: SPACER }}
          onPress={mapsHref ? openMaps : editPlace}
        />

        {/* RECEIPT SHEET */}
        <View
          className="rounded-t-3xl bg-zinc-900 px-4 pt-3"
          style={{ minHeight: 560, paddingBottom: 130 }}
        >
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-zinc-700" />

          {refreshing && (
            <View className="mb-2 flex-row items-center gap-2">
              <View className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <Text
                style={mono}
                className="text-[9px] uppercase tracking-[.2em] text-amber-400/80"
              >
                Refreshing
              </Text>
            </View>
          )}

          <ReceiptHeader caption="RECEIPT" />

          {/* META */}
          <View className="mt-3 flex-row justify-between">
            <Text style={mono} className="text-xs text-zinc-500">
              {visited ?? "—"}
            </Text>
            <Text style={mono} className="text-xs text-zinc-500">
              {orderNo}
            </Text>
          </View>

          <DashDivider />

          {/* ITEM */}
          <Text style={mono} className="text-xl font-bold text-amber-100">
            {place.name.toUpperCase()}
          </Text>

          <View className="mt-2 flex-row">
            {[1, 2, 3, 4, 5].map((n) => (
              <Text
                key={n}
                style={mono}
                className={`text-lg ${n <= filled ? "text-amber-400" : "text-zinc-700"}`}
              >
                ★
              </Text>
            ))}
          </View>

          <View className="mt-2">
            <ReceiptLine label="RATING" value={`${rating}/5`} />
          </View>

          <Text
            style={mono}
            className={`mt-2 text-center text-sm font-bold ${meta.color}`}
          >
            [ {meta.label} ]
          </Text>

          {/* Only the genuinely-unresolved field shimmers; the rest is real. */}
          {hubKnown ? (
            <View className="mt-2">
              <ReceiptLine label="STATION" value={hubName} />
            </View>
          ) : (
            <View className="mt-3 flex-row items-center">
              <Text style={mono} className="text-xs text-zinc-400">
                STATION
              </Text>
              <View className="mx-2 flex-1 border-b border-dashed border-zinc-700" />
              <SkelBar w={96} h={10} />
            </View>
          )}

          <DashDivider />

          {/* LOCATION */}
          <Text style={mono} className="text-xs text-zinc-300">
            📍 {place.address || "No address"}
          </Text>

          <DashDivider />

          {/* PROS | CONS — side by side so an empty list doesn't cost a whole section */}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text style={mono} className="text-xs font-bold uppercase text-green-400">
                Pros
              </Text>
              {place.pros?.length > 0 ? (
                place.pros.map((pro: string, index: number) => (
                  <Text key={index} style={mono} className="mt-1 text-xs text-zinc-300">
                    + {pro}
                  </Text>
                ))
              ) : (
                <Text style={mono} className="mt-1 text-xs text-zinc-600">
                  none
                </Text>
              )}
            </View>

            <View className="flex-1">
              <Text style={mono} className="text-xs font-bold uppercase text-red-400">
                Cons
              </Text>
              {place.cons?.length > 0 ? (
                place.cons.map((con: string, index: number) => (
                  <Text key={index} style={mono} className="mt-1 text-xs text-zinc-300">
                    - {con}
                  </Text>
                ))
              ) : (
                <Text style={mono} className="mt-1 text-xs text-zinc-600">
                  none
                </Text>
              )}
            </View>
          </View>

          <DashDivider />

          {/* FAVORITE DISHES */}
          <Text style={mono} className="text-xs font-bold uppercase text-orange-400">
            Favorite Dishes
          </Text>
          {place.favorite_dishes?.length > 0 ? (
            place.favorite_dishes.map((dish: string, index: number) => (
              <Text key={index} style={mono} className="mt-1 text-xs text-zinc-300">
                🍜 {dish}
              </Text>
            ))
          ) : (
            <Text style={mono} className="mt-1 text-xs text-zinc-600">
              none
            </Text>
          )}

          <DashDivider />

          <Text style={mono} className="text-center text-xs text-zinc-500">
            THANK YOU, COME AGAIN
          </Text>

          {/* MORE AROUND HERE */}
          {around.length > 0 && (
            <>
              <View className="mb-3 mt-6 flex-row items-center gap-2">
                <Text style={mono} className="text-[10px] font-bold uppercase tracking-[.2em] text-zinc-400">
                  More around here
                </Text>
                <View className="flex-1 border-t border-dashed border-zinc-700" />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
              >
                {around.map(({ place: p, distance }) => {
                  const lc = lineFor(p.hub_id);
                  const stars = Math.round(p.rating ?? 0);
                  const hub = hubs.find((h) => h.id === p.hub_id)?.name ?? "UNSORTED";
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => push(`/place/${p.id}`)}
                      className="w-[128px] overflow-hidden rounded-2xl p-3"
                      style={{ backgroundColor: lc.bg }}
                    >
                      <Text
                        numberOfLines={2}
                        style={{ color: lc.ink, fontSize: 13, fontWeight: "800", lineHeight: 16 }}
                      >
                        {p.name}
                      </Text>
                      <Text style={{ color: lc.ink, fontSize: 11, letterSpacing: 1, marginTop: 4 }}>
                        {"★".repeat(stars)}
                        {"☆".repeat(5 - stars)}
                      </Text>
                      <View className="mt-2 flex-row items-center justify-between gap-1">
                        <Text
                          numberOfLines={1}
                          style={{
                            ...mono,
                            flex: 1,
                            color: lc.inkMuted,
                            fontSize: 8.5,
                            fontWeight: "800",
                            textTransform: "uppercase",
                          }}
                        >
                          {hub}
                        </Text>
                        <Text
                          style={{ ...mono, color: lc.ink, fontSize: 8.5, fontWeight: "800" }}
                        >
                          {formatDistance(distance)}
                        </Text>
                      </View>
                      {/* ticket notch, same colour as the sheet */}
                      <View
                        className="absolute h-3.5 w-3.5 rounded-full bg-zinc-900"
                        style={{ right: -7, top: "50%", marginTop: -7 }}
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>

      {/* DIRECTIONS chip, resting on the map above the sheet */}
      {(mapsHref || !hasPin) && (
        <Pressable
          onPress={mapsHref ? openMaps : editPlace}
          className="absolute right-3 flex-row items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2"
          style={{ top: SPACER - 46 }}
        >
          <Ionicons name={mapsHref ? "navigate" : "add"} size={13} color="#000" />
          <Text style={mono} className="text-[10px] font-bold uppercase tracking-widest text-black">
            {mapsHref ? "Directions" : "Add location"}
          </Text>
        </Pressable>
      )}

      {/* HEADER: back, station chip, overflow */}
      <View
        className="absolute left-3 right-3 flex-row items-center justify-between"
        style={{ top: insets.top + 8 }}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={6}
          className="h-10 w-10 items-center justify-center rounded-full border border-zinc-600 bg-zinc-950/80"
        >
          <Ionicons name="chevron-back" size={18} color="#d4d4d8" />
        </Pressable>

        <View className="flex-row items-center gap-2">
          {hubKnown && (
            <View
              className="flex-row items-center gap-1.5 rounded-full px-3 py-2"
              style={{ backgroundColor: line.bg }}
            >
              <View className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: line.ink }} />
              <Text
                style={{ ...mono, color: line.ink, fontSize: 9.5, fontWeight: "800", letterSpacing: 1.2 }}
              >
                {hubName.toUpperCase()}
              </Text>
            </View>
          )}
          <Pressable
            onPress={() => setShowMore((v) => !v)}
            hitSlop={6}
            className="h-10 w-10 items-center justify-center rounded-full border border-zinc-600 bg-zinc-950/80"
          >
            <Ionicons
              name={showMore ? "close" : "ellipsis-horizontal"}
              size={17}
              color="#d4d4d8"
            />
          </Pressable>
        </View>
      </View>

      {showMore && (
        <>
          <Pressable
            className="absolute inset-0"
            onPress={() => setShowMore(false)}
          />
          <View
            className="absolute right-3 w-52 gap-2 rounded-2xl border border-zinc-700 bg-zinc-950 p-2"
            style={{ top: insets.top + 56 }}
          >
            <Pressable
              onPress={editPlace}
              className="h-11 flex-row items-center gap-3 rounded-xl border border-zinc-700 px-3"
            >
              <Ionicons name="create-outline" size={17} color="#fbbf24" />
              <Text style={mono} className="text-xs font-bold uppercase tracking-widest text-zinc-200">
                Edit place
              </Text>
            </Pressable>

            <Pressable
              onPress={handleDelete}
              className="h-11 flex-row items-center gap-3 rounded-xl border border-red-900 bg-red-950/40 px-3"
            >
              <Ionicons name="trash-outline" size={17} color="#f87171" />
              <Text style={mono} className="text-xs font-bold uppercase tracking-widest text-red-400">
                Delete place
              </Text>
            </Pressable>
          </View>
        </>
      )}

      {/* STICKY ACTIONS — revisit is what you came to do, so it never scrolls
          away. Right padding leaves room for the floating menu button. */}
      <View className="absolute bottom-0 left-0 right-0" pointerEvents="box-none">
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(9,9,11,0)", "rgba(9,9,11,0.96)"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          className="flex-row items-center gap-2 pl-4"
          style={{ paddingRight: 92, paddingTop: 30, paddingBottom: insets.bottom + 32 }}
        >
          <Pressable
            onPress={handleUndoRevisit}
            disabled={revisits <= 0}
            className="h-12 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950"
            style={{ opacity: revisits <= 0 ? 0.35 : 1 }}
          >
            <Text style={mono} className="text-sm font-bold text-zinc-300">
              −
            </Text>
          </Pressable>

          <Pressable
            onPress={handleRevisit}
            className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-amber-400"
          >
            <Text style={mono} className="text-sm font-bold text-black">
              + REVISIT
            </Text>
            <Text style={mono} className="text-sm font-bold text-black/45">
              {revisits}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
