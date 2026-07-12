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
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.97 : 1 }],
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        className="mb-4 flex-row gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        {/* AMBER ACCENT BAR */}
        <View className="w-1.5 self-stretch rounded-full bg-amber-400" />

        {/* CONTENT */}
        <View className="flex-1">
          <Text className="text-xl font-bold text-white">
            {name}
          </Text>

          <Text className="mt-1 text-zinc-400" numberOfLines={1}>
            {address}
          </Text>
        </View>

        {/* RATING PILL */}
        <View className="self-start rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1">
          <Text className="text-amber-400">⭐ {rating}</Text>
        </View>
      </View>
    </Pressable>
  );
}