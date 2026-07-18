import { useCallback, useState } from "react";

import { useFocusEffect, router, useLocalSearchParams } from "expo-router";
import { Alert, Linking, Text, View } from "react-native";

import { usePlacesStore } from "../../../stores/placesStore";
import { useHubsStore } from "../../../stores/hubsStore";
import { useGuardedPush } from "../../../utils/navigation";
import { getRatingMeta } from "../../../utils/rating";
import type { Place } from "../../../types/place";

import PageLoader from "../../../components/PageLoader";

import { showErrorToast, showSuccessToast } from "../../../components/Toast";

import ScreenWrapper from "../../../components/ScreenWrapper";
import AppButton from "../../../components/AppButton";
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
  const deletePlace = usePlacesStore((s) => s.deletePlace);
  const incrementRevisit = usePlacesStore((s) => s.incrementRevisit);

  const fetchHubs = useHubsStore((s) => s.fetchHubs);
  const hubs = useHubsStore((s) => s.hubs);

  const push = useGuardedPush();

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadPlace();
      loadHubs();
    }, [id])
  );

  const loadPlace = async () => {
    const data = await fetchPlace(id as string);
    setPlace(data);
    setLoading(false);
  };

  const loadHubs = async () => {
    await fetchHubs();
  };

  const handleRevisit = () => {
    if (!place) return;
    incrementRevisit(place.id);
    setPlace((prev) =>
      prev ? { ...prev, revisit_count: (prev.revisit_count ?? 0) + 1 } : prev
    );
  };

  const handleDelete = () => {
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

  if (loading) {
    return <PageLoader />;
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

  const hubName =
    place.hub_id && hubs.length > 0
      ? hubs.find((h) => h.id === place.hub_id)?.name ?? "UNSORTED"
      : "UNSORTED";

  return (
    <ScreenWrapper scroll>
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

        <View className="mt-2">
          <ReceiptLine label="STATION" value={hubName} />
        </View>

        <View className="mt-1 flex-row items-center justify-between">
          <Text style={mono} className="text-xs text-zinc-400">
            VISITS: {place.revisit_count ?? 0}
          </Text>
          <Text
            style={mono}
            onPress={handleRevisit}
            className="rounded-md bg-zinc-800 px-3 py-1 text-xs font-semibold text-amber-400"
          >
            REVISIT
          </Text>
        </View>

        <DashDivider />

        {/* LOCATION */}
        <View className="flex-row items-center justify-between">
          <Text style={mono} className="flex-1 text-xs text-zinc-300">
            📍 {place.address || "No address"}
          </Text>

          {mapsHref && (
            <Text
              style={mono}
              onPress={openMaps}
              className="ml-2 rounded-md bg-zinc-800 px-3 py-1 text-xs font-semibold text-white"
            >
              MAPS ↗
            </Text>
          )}
        </View>

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
          THANK YOU — COME AGAIN
        </Text>
      </View>

      <ReceiptEdge dir="bottom" />

      {/* ACTIONS */}
      <View className="mt-5 gap-4">
        <AppButton title="EDIT PLACE" onPress={() => push(`/edit/${id}`)} />

        <View className="rounded-xl bg-red-500">
          <AppButton title="DELETE PLACE" onPress={handleDelete} />
        </View>
      </View>
    </ScreenWrapper>
  );
}
