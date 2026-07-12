import { useCallback, useState } from "react";

import { useFocusEffect, router, useLocalSearchParams } from "expo-router";
import {
  Alert,
  Linking,
  Text,
  View,
} from "react-native";

import { usePlacesStore } from "../../../stores/placesStore";
import type { Place } from "../../../types/place";

import PageLoader from "../../../components/PageLoader";

import {
  showErrorToast,
  showSuccessToast,
} from "../../../components/Toast";

import ScreenWrapper from "../../../components/ScreenWrapper";
import ScreenHeader from "../../../components/ScreenHeader";
import AppButton from "../../../components/AppButton";

export default function PlaceDetailsScreen() {
  const { id } = useLocalSearchParams();

  const fetchPlace = usePlacesStore((s) => s.fetchPlace);
  const deletePlace = usePlacesStore((s) => s.deletePlace);

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadPlace();
    }, [id])
  );

  const getRatingMeta = (rating: number) => {
    if (rating >= 4.5) {
      return {
        color: "text-green-400",
        label: "🔥 This Fire",
      };
    }

    if (rating >= 3) {
      return {
        color: "text-yellow-400",
        label: "👍 oks na bai",
      };
    }

    return {
      color: "text-red-400",
      label: "😬 kadiri boi",
    };
  };

  const ratingMeta = getRatingMeta(
    Number(place?.rating ?? 0)
  );

  const loadPlace = async () => {
    const data = await fetchPlace(id as string);
    setPlace(data);
    setLoading(false);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Place",
      "Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
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
      ]
    );
  };

  const mapsHref = place?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${place.name} ${place.address}`
    )}`
    : null;

  const openMaps = async () => {
    if (!mapsHref) return;

    const supported = await Linking.canOpenURL(mapsHref);

    if (supported) {
      await Linking.openURL(mapsHref);
    } else {
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
          <Text className="text-white">
            Place not found.
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll>
      <ScreenHeader
        title={place.name}
        subtitle={place.address || "No address"}
      />

      {/* MAIN CARD */}
      <View className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
        {/* RATING */}
        <View className="mb-6">
          <Text className="mb-2 text-sm font-bold uppercase tracking-widest text-amber-400">
            Rating
          </Text>

          <View className="flex-row items-center">
            <Text
              className={`text-4xl font-black ${ratingMeta.color}`}
            >
              ⭐ {place.rating}
            </Text>

            <View className="ml-4 rounded-full bg-zinc-900 px-3 py-2">
              <Text
                className={`text-sm font-bold ${ratingMeta.color}`}
              >
                {ratingMeta.label}
              </Text>
            </View>
          </View>
        </View>

        {/* ADDRESS + MAPS */}
        <View className="mb-8 flex-row items-center justify-between rounded-2xl bg-zinc-900 p-4">
          <Text className="flex-1 text-base text-zinc-300">
            📍 {place.address || "No address"}
          </Text>

          {mapsHref && (
            <Text
              onPress={openMaps}
              className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-white"
            >
              Maps ↗
            </Text>
          )}
        </View>

        {/* PROS */}
        <View className="mb-8">
          <Text className="mb-4 text-sm font-bold uppercase tracking-widest text-green-400">
            Pros
          </Text>

          {place.pros?.length > 0 ? (
            place.pros.map(
              (pro: string, index: number) => (
                <Text
                  key={index}
                  className="mb-3 text-base leading-6 text-zinc-300"
                >
                  • {pro}
                </Text>
              )
            )
          ) : (
            <Text className="text-zinc-500">
              No pros added.
            </Text>
          )}
        </View>

        {/* CONS */}
        <View className="mb-8">
          <Text className="mb-4 text-sm font-bold uppercase tracking-widest text-red-400">
            Cons
          </Text>

          {place.cons?.length > 0 ? (
            place.cons.map(
              (con: string, index: number) => (
                <Text
                  key={index}
                  className="mb-3 text-base leading-6 text-zinc-300"
                >
                  • {con}
                </Text>
              )
            )
          ) : (
            <Text className="text-zinc-500">
              No cons added.
            </Text>
          )}
        </View>

        {/* FAVORITE DISHES */}
        <View className="mb-10">
          <Text className="mb-4 text-sm font-bold uppercase tracking-widest text-orange-400">
            Favorite Dishes
          </Text>

          {place.favorite_dishes?.length > 0 ? (
            place.favorite_dishes.map(
              (dish: string, index: number) => (
                <Text
                  key={index}
                  className="mb-3 text-base leading-6 text-zinc-300"
                >
                  🍜 {dish}
                </Text>
              )
            )
          ) : (
            <Text className="text-zinc-500">
              No favorite dishes added.
            </Text>
          )}
        </View>

        {/* ACTIONS */}
        <View className="gap-4">
          <AppButton
            title="EDIT PLACE"
            onPress={() =>
              router.push(`/edit/${id}`)
            }
          />

          <View className="rounded-2xl bg-red-500">
            <AppButton
              title="DELETE PLACE"
              onPress={handleDelete}
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}