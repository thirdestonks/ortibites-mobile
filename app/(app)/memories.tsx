import { Pressable, Text, View } from "react-native";

import ScreenWrapper from "../../components/ScreenWrapper";
import ScreenHeader from "../../components/ScreenHeader";
import { useGuardedPush } from "../../utils/navigation";

export default function MemoriesScreen() {
  const push = useGuardedPush();

  return (
    <ScreenWrapper>
      <ScreenHeader title="MEMORIES" subtitle="food moments through time 📸" />

      <View className="flex-1 items-center justify-center mb-20">
        <Text className="text-7xl mb-6">✨</Text>

        <Text className="text-center text-3xl font-black tracking-widest text-white">
          FOOD WRAPPED
        </Text>

        <Text className="mt-3 text-center text-zinc-400">
          Your Ortigas food year, wrapped up.
        </Text>

        <Pressable
          onPress={() => push("/wrapped")}
          className="mt-8 rounded-xl bg-white px-8 py-4"
        >
          <Text className="text-lg font-black text-black">
            VIEW YOUR WRAPPED →
          </Text>
        </Pressable>
      </View>
    </ScreenWrapper>
  );
}
