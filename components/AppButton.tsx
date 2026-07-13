import { Pressable, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { PRESS_SPRING } from "../utils/motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AppButton({ title, onPress }: any) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, PRESS_SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, PRESS_SPRING);
      }}
      style={style}
      className="mb-5 rounded-xl bg-white"
    >
      <Text className="p-4 text-center text-lg font-black text-black">
        {title}
      </Text>
    </AnimatedPressable>
  );
}
