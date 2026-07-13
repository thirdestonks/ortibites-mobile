import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";

import { PRESS_SPRING } from "../utils/motion";

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
}

function Star({
  active,
  onPress,
}: {
  active: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.4, PRESS_SPRING),
      withSpring(1, PRESS_SPRING)
    );
    onPress();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.Text style={style} className="text-4xl">
        {active ? "⭐" : "☆"}
      </Animated.Text>
    </Pressable>
  );
}

export default function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <Animated.View className="flex-row gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          active={star <= value}
          onPress={() => onChange(star)}
        />
      ))}
    </Animated.View>
  );
}
