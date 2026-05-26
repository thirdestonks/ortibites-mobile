import { useEffect, useState } from "react";
import {
  FlatList,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";

import api from "../services/api";

import { Place } from "../types/place";

import PlaceCard from "../components/PlaceCard";
import PageLoader from "../components/PageLoader";

import ScreenWrapper from "../components/ScreenWrapper";
import ScreenHeader from "../components/ScreenHeader";
import AppButton from "../components/AppButton";

export default function HomeScreen() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    setLoading(true);

    try {
      const response = await api.get("/restaurants");

      setPlaces(response.data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <ScreenWrapper>
      <ScreenHeader
        title="ORTIBITES"
        subtitle="kain ano tara?? 🍜"
      />

      <AppButton
        title="+ ADD PLACE"
        onPress={() => router.push("/create")}
      />

      {places.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-zinc-400">
            No places found.
          </Text>
        </View>
      ) : (
        <FlatList
          data={places}
          refreshing={loading}
          onRefresh={fetchPlaces}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120,
          }}
          renderItem={({ item }) => (
            <PlaceCard
              id={item.id}
              name={item.name}
              address={item.address}
              rating={item.rating}
            />
          )}
        />
      )}
    </ScreenWrapper>
  );
}