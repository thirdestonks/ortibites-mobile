import {
  Text,
  View,
} from "react-native";

import ScreenWrapper from "../components/ScreenWrapper";
import ScreenHeader from "../components/ScreenHeader";

export default function MemoriesScreen() {
  return (
    <ScreenWrapper>
      <ScreenHeader
        title="MEMORIES"
        subtitle="food moments through time 📸"
      />

      <View className="flex-1 items-center justify-center mb-20">
        <Text className="text-7xl mb-6">
          🚧
        </Text>

        <Text className="text-center text-3xl font-black tracking-widest text-white">
          COMING SOON
        </Text>

        <Text className="mt-3 text-center text-zinc-400">
          Memories Timeline arrives in v1.1.0
        </Text>
      </View>
    </ScreenWrapper>
  );
}