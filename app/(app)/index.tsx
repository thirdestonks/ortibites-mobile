import React, { useCallback } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";

import { useGuardedPush } from "../../utils/navigation";
import { usePlacesStore } from "../../stores/placesStore";
import { useAuthStore } from "../../stores/authStore";
import PlaceCard from "../../components/PlaceCard";
import SkeletonCard from "../../components/SkeletonCard";
import ScreenWrapper from "../../components/ScreenWrapper";
import ScreenHeader from "../../components/ScreenHeader";
import AppButton from "../../components/AppButton";
import EmptyState from "../../components/EmptyState";

export default function HomeScreen() {
  const places = usePlacesStore((s) => s.places);
  const loading = usePlacesStore((s) => s.loading);
  const fetchPlaces = usePlacesStore((s) => s.fetchPlaces);
  const signOut = useAuthStore((s) => s.signOut);
  const push = useGuardedPush();

  useFocusEffect(
    useCallback(() => {
      fetchPlaces();
    }, [fetchPlaces])
  );

  const logoutButton = (
    <Pressable
      onPress={signOut}
      className="rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-2"
    >
      <Text className="text-xs font-bold uppercase tracking-widest text-amber-400">
        Log out
      </Text>
    </Pressable>
  );

  const headerActions = (
    <View className="items-end gap-2">
      <Pressable
        onPress={() => push("/roulette")}
        className="rounded-full border border-amber-400/60 bg-amber-400/10 px-4 py-2"
      >
        <Text className="text-xs font-bold uppercase tracking-widest text-amber-400">
          🎲 Decide
        </Text>
      </Pressable>
      {logoutButton}
    </View>
  );

  if (loading && places.length === 0) {
    return (
      <ScreenWrapper>
        <ScreenHeader
          title="ORTIBITES"
          subtitle="kain ano tara?? 🍜"
          right={headerActions}
        />

        <AppButton title="+ ADD PLACE" onPress={() => push("/create")} />

        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScreenHeader
        title="ORTIBITES"
        subtitle="kain ano tara?? 🍜"
        right={headerActions}
      />

      <AppButton title="+ ADD PLACE" onPress={() => push("/create")} />

      {places.length === 0 ? (
        <EmptyState title="NO BITES YET" subtitle="Add your first food spot 🍜" />
      ) : (
        <FlatList
          data={places}
          refreshing={loading}
          onRefresh={fetchPlaces}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 150 }}
          renderItem={({ item, index }) => (
            <PlaceCard place={item} index={index} />
          )}
        />
      )}
    </ScreenWrapper>
  );
}
