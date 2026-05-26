import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import {
  Alert,
  Text,
  View,
} from "react-native";

import api from "../../services/api";

import PageLoader from "../../components/PageLoader";

import {
  showSuccessToast,
} from "../../components/Toast";

import ScreenWrapper from "../../components/ScreenWrapper";
import ScreenHeader from "../../components/ScreenHeader";
import AppButton from "../../components/AppButton";

export default function PlaceDetailsScreen() {
  const { id } = useLocalSearchParams();

  const [place, setPlace] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlace();
  }, []);

  const fetchPlace = async () => {
    try {
      const response = await api.get(`/restaurants/${id}`);

      setPlace(response.data.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
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
            try {
              await api.delete(`/restaurants/${id}`);

              showSuccessToast(
                "Success",
                "Place deleted"
              );

              router.replace("/");
            } catch (error) {
              console.log(error);
            }
          },
        },
      ]
    );
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
        <View className="mb-8">
          <Text className="mb-2 text-sm font-bold uppercase tracking-widest text-amber-400">
            Rating
          </Text>

          <Text className="text-4xl font-black text-yellow-400">
            ⭐ {place.rating}
          </Text>
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