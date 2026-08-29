import { useCallback, useState } from "react";

import { useFocusEffect, router, useLocalSearchParams } from "expo-router";
import { Alert, Linking, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { usePlacesStore } from "../../../stores/placesStore";
import { useHubsStore } from "../../../stores/hubsStore";
import { useGuardedPush } from "../../../utils/navigation";
import { getRatingMeta } from "../../../utils/rating";
import type { Place } from "../../../types/place";

import { showErrorToast, showSuccessToast } from "../../../components/Toast";

import ScreenWrapper from "../../../components/ScreenWrapper";
import ReceiptSkeleton, { SkelBar } from "../../../components/ReceiptSkeleton";
import {
  mono,
  ReceiptEdge,
  ReceiptHeader,
  ReceiptLine,
  DashDivider,
} from "../../../components/receipt";

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

  const fetchPlace = usePlacesStore((s) => s.fetchPlace);
  const getCached = usePlacesStore((s) => s.getCached);
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

  // Hubs load separately, so show a placeholder rather than a wrong "UNSORTED".
  const hubKnown = !place.hub_id || hubs.length > 0;
  const hubName = !place.hub_id
    ? "UNSORTED"
    : hubs.find((h) => h.id === place.hub_id)?.name ?? "UNSORTED";

  return (
    <ScreenWrapper scroll>
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

      <ReceiptEdge dir="top" />

      <View className="bg-zinc-900 px-5 pb-6 pt-3">
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

        {/* PROS */}
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

        <DashDivider />

        {/* CONS */}
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
      </View>

      <ReceiptEdge dir="bottom" />

      {/* ACTIONS — revisit is what you actually came to do, so it leads.
          Edit and Delete sit behind the overflow so Delete is never a
          full-width red target under your thumb. */}
      <View className="mt-5 flex-row items-center gap-2">
        <Pressable
          onPress={handleUndoRevisit}
          disabled={revisits <= 0}
          className="h-12 w-11 items-center justify-center rounded-xl border border-zinc-700"
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

        {mapsHref && (
          <Pressable
            onPress={openMaps}
            className="h-12 w-12 items-center justify-center rounded-xl border border-zinc-700"
          >
            <Ionicons name="navigate" size={17} color="#d4d4d8" />
          </Pressable>
        )}

        <Pressable
          onPress={() => setShowMore((v) => !v)}
          className="h-12 w-12 items-center justify-center rounded-xl border border-zinc-700"
        >
          <Ionicons
            name={showMore ? "close" : "ellipsis-horizontal"}
            size={17}
            color="#d4d4d8"
          />
        </Pressable>
      </View>

      {showMore && (
        <View className="mt-2 gap-2">
          <Pressable
            onPress={() => {
              setShowMore(false);
              push(`/edit/${id}`);
            }}
            className="h-12 flex-row items-center gap-3 rounded-xl border border-zinc-700 px-4"
          >
            <Ionicons name="create-outline" size={17} color="#fbbf24" />
            <Text style={mono} className="text-xs font-bold uppercase tracking-widest text-zinc-200">
              Edit place
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            className="h-12 flex-row items-center gap-3 rounded-xl border border-red-900 bg-red-950/40 px-4"
          >
            <Ionicons name="trash-outline" size={17} color="#f87171" />
            <Text style={mono} className="text-xs font-bold uppercase tracking-widest text-red-400">
              Delete place
            </Text>
          </Pressable>
        </View>
      )}
    </ScreenWrapper>
  );
}
