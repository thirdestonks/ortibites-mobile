import { Text, View } from "react-native";

export default function PageLoader() {
  return (
    <View className="flex-1 items-center justify-center overflow-hidden bg-zinc-950">

      {/* BACKGROUND GLOWS */}

      <View className="absolute -top-10 -left-10 h-56 w-56 rounded-full bg-orange-500/20" />

      <View className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-400/10" />

      <View className="absolute top-1/3 right-10 h-32 w-32 rounded-full bg-red-500/10" />

      {/* CONTENT */}

      <Text className="text-7xl">
        🍜
      </Text>

      <Text className="mt-5 text-lg font-bold tracking-[6px] text-amber-400">
        LOADING BITES...
      </Text>

    </View>
  );
}