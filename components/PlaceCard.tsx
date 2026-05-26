import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

interface PlaceCardProps {
  id: number;
  name: string;
  address: string;
  rating: number;
}

export default function PlaceCard({
  id,
  name,
  address,
  rating,
}: PlaceCardProps) {
  return (
    <Pressable
      onPress={() => router.push(`/place/${id}`)}
    >
      <View className="mb-4 rounded-2xl bg-zinc-900 p-5">
        <Text className="text-xl font-bold text-white">
          {name}
        </Text>

        <Text className="mt-1 text-zinc-400">
          {address}
        </Text>

        <Text className="mt-3 text-yellow-400">
          ⭐ {rating}
        </Text>
      </View>
    </Pressable>
  );
}