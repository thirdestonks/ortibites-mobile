import { View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

import { DURATION, EASE_OUT } from "../utils/motion";
import MetroBackdrop, { NIGHT } from "./MetroBackdrop";
import StationSign from "./StationSign";
import TrainLoader from "./TrainLoader";
import { useSignFlash } from "./useSignFlash";

/**
 * Shown on launch until the session check finishes. Same night transit map as
 * the login screen, so for a signed-out user the splash hands straight over to
 * the login without a visual jump.
 */
export default function AppSplash() {
  const { letters, ring } = useSignFlash({ firstDelay: 500, period: 5200 });

  return (
    <Animated.View
      exiting={FadeOut.duration(DURATION.base)}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: NIGHT,
      }}
    >
      <StatusBar style="light" />
      <MetroBackdrop />

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Animated.View entering={FadeInDown.duration(DURATION.slow).easing(EASE_OUT)}>
          <StationSign letters={letters} ring={ring} tagline="your food memories" />
        </Animated.View>

        <Animated.View
          entering={FadeIn.delay(300).duration(DURATION.base)}
          style={{ marginTop: 40 }}
        >
          <TrainLoader variant="dark" label="BOARDING…" />
        </Animated.View>
      </View>
    </Animated.View>
  );
}
