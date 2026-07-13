import { usePathname } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { PRESS_SPRING } from "../utils/motion";
import { useGuardedPush } from "../utils/navigation";
import { useShake } from "../utils/useShake";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function BottomNav() {
  const pathname = usePathname();
  const push = useGuardedPush();

  const home = useShake();
  const memory = useShake();

  const fabScale = useSharedValue(1);
  const fabShake = useSharedValue(0);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: fabShake.value }, { scale: fabScale.value }],
  }));

  const go = (route: string, item: { shake: () => void }) => {
    if (pathname === route) {
      item.shake();
    } else {
      push(route);
    }
  };

  const goFab = () => {
    if (pathname === "/create") {
      fabShake.value = withSequence(
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    } else {
      push("/create");
    }
  };

  return (
    <View className="absolute bottom-0 w-full px-4 pb-10">
      <View className="relative flex-row items-center justify-center gap-60 rounded-3xl border border-zinc-800 bg-zinc-950/95 px-10 py-5">
        {/* HOME */}
        <AnimatedPressable
          onPress={() => go("/", home)}
          style={home.shakeStyle}
          className="items-center"
        >
          <Text className="text-2xl text-zinc-300">⌂</Text>
          <Text className="text-zinc-300">Home</Text>
        </AnimatedPressable>

        {/* MEMORY */}
        <AnimatedPressable
          onPress={() => go("/memories", memory)}
          style={memory.shakeStyle}
          className="items-center"
        >
          <Text className="text-2xl text-amber-400">🕒</Text>
          <Text className="text-amber-400">Memory</Text>
        </AnimatedPressable>

        {/* FLOATING BUTTON */}
        <AnimatedPressable
          onPress={goFab}
          onPressIn={() => {
            fabScale.value = withSpring(0.88, PRESS_SPRING);
          }}
          onPressOut={() => {
            fabScale.value = withSpring(1, PRESS_SPRING);
          }}
          className="absolute -top-8 h-20 w-20 items-center justify-center rounded-full bg-orange-400"
          style={[
            fabStyle,
            {
              shadowColor: "#fb923c",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 10,
            },
          ]}
        >
          <Text className="text-5xl text-black">+</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}
