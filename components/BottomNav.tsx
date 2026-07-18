import { usePathname } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
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
    if (pathname === route) item.shake();
    else push(route);
  };

  const StationNode = ({ icon, label }: { icon: string; label: string }) => (
    <View className="items-center">
      <View className="h-14 w-14 items-center justify-center rounded-full border-2 border-amber-400 bg-zinc-950">
        <Text className="text-xl">{icon}</Text>
      </View>
      <Text className="mt-1 text-xs font-bold uppercase tracking-widest text-zinc-300">
        {label}
      </Text>
    </View>
  );

  return (
    <View className="absolute bottom-0 w-full px-6 pb-8">
      <View className="flex-row items-center justify-between">
        {/* HOME node */}
        <AnimatedPressable onPress={() => go("/", home)} style={home.shakeStyle}>
          <StationNode icon="🏠" label="Home" />
        </AnimatedPressable>

        {/* connector — left */}
        <View className="mb-5 h-0.5 flex-1 bg-amber-400/60" />

        {/* TERMINUS (+) */}
        <AnimatedPressable
          onPress={() => {
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
          }}
          onPressIn={() => (fabScale.value = withSpring(0.88, PRESS_SPRING))}
          onPressOut={() => (fabScale.value = withSpring(1, PRESS_SPRING))}
          className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-orange-400"
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

        {/* connector — right */}
        <View className="mb-5 h-0.5 flex-1 bg-amber-400/60" />

        {/* MEMORY node */}
        <AnimatedPressable onPress={() => go("/memories", memory)} style={memory.shakeStyle}>
          <StationNode icon="🕒" label="Memory" />
        </AnimatedPressable>
      </View>
    </View>
  );
}
