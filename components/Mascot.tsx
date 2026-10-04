import { useEffect } from "react";
import { Image } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { DURATION, EASE_OUT } from "../utils/motion";

/**
 * May, the app mascot. Each pose maps to an app state:
 *   explorer - discovery (no spots yet, adding a place)
 *   thinking - undecided (roulette waiting on a spin)
 *   happy    - payoff (a winner landed)
 *
 * Metro's asset resolver needs literal require() paths, so the poses are a
 * static map rather than an interpolated filename.
 */
const POSES = {
  happy: require("../assets/images/happy_may.png"),
  thinking: require("../assets/images/thinking_may.png"),
  explorer: require("../assets/images/explorer_may.png"),
} as const;

export type MascotPose = keyof typeof POSES;

interface MascotProps {
  pose: MascotPose;
  /** Rendered width and height in px. Source art is 675x675. */
  size?: number;
  /** Gentle idle float, matching EmptyState and PageLoader. */
  bob?: boolean;
}

export default function Mascot({ pose, size = 140, bob = true }: MascotProps) {
  const float = useSharedValue(0);

  useEffect(() => {
    if (!bob) return;
    float.value = withRepeat(
      withTiming(1, { duration: 1600, easing: EASE_OUT }),
      -1,
      true
    );
  }, [float, bob]);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -10 * float.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(DURATION.base)}
      style={bob ? bobStyle : undefined}
    >
      <Image
        source={POSES[pose]}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </Animated.View>
  );
}
