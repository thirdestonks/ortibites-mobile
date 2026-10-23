import { memo, useEffect } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import StationSign from "./StationSign";
import { useSignFlash } from "./useSignFlash";

const CAR_W = 70;
const CAR_H = 28;
const CAR_GAP = 3;
const CARS = 4;
const TRAIN_W = CARS * CAR_W + (CARS - 1) * CAR_GAP;
const MARGIN = 24; // how far off-screen the train starts and ends
const TRAIL_W = 150;

const PASS_MS = 1100; // time on screen: it flashes by, it doesn't cruise
const PAUSE_MS = 6500; // quiet time between passes
const FIRST_MS = 1200; // first pass shortly after the screen opens

/**
 * A dark train silhouette that streaks across every few seconds. The ORTIBITES
 * station sign above it is always readable and lights up amber as the train
 * crosses the middle of the screen. Built for the dark Night Service screens.
 */
function TrainFlash({ glow = "#fbbf24" }: { glow?: string }) {
  const { width } = useWindowDimensions();
  const pass = useSharedValue(0); // 0 = waiting off-screen right, 1 = gone off-screen left

  useEffect(() => {
    pass.value = withDelay(
      FIRST_MS,
      withRepeat(
        withSequence(
          withTiming(1, { duration: PASS_MS, easing: Easing.linear }),
          withTiming(0, { duration: 0 }),
          // holds at 0 for the pause: a 0 -> 0 timing is just a delay
          withDelay(PAUSE_MS, withTiming(0, { duration: 0 }))
        ),
        -1
      )
    );
  }, [pass]);

  const trainStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(pass.value, [0, 1], [width + MARGIN, -TRAIN_W - MARGIN]),
      },
    ],
  }));

  // The sign lights up as the train reaches the middle, and stays lit well
  // after it has gone (about 1 to 2 seconds), then flickers out letter by letter.
  const { letters, ring } = useSignFlash({
    firstDelay: FIRST_MS + PASS_MS * 0.42,
    period: PASS_MS + PAUSE_MS,
  });

  return (
    <View style={{ width, marginHorizontal: -18 }}>
      <StationSign letters={letters} ring={ring} />

      {/* Track + train */}
      <View style={{ height: CAR_H + 8, marginTop: 10, overflow: "hidden" }}>
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 2,
            height: 2,
            backgroundColor: "#4a3d27",
          }}
        />
        <Animated.View
          pointerEvents="none"
          style={[{ position: "absolute", left: 0, bottom: 4, flexDirection: "row" }, trainStyle]}
        >
          {Array.from({ length: CARS }).map((_, i) => (
            <View
              key={i}
              style={{
                width: CAR_W,
                height: CAR_H,
                marginRight: i === CARS - 1 ? 0 : CAR_GAP,
                borderRadius: 7,
                backgroundColor: "#120d06",
                borderWidth: 1.5,
                borderColor: "#8a7436",
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-evenly",
                paddingTop: 6,
              }}
            >
              {[0, 1, 2, 3].map((w) => (
                <View
                  key={w}
                  style={{
                    width: 9,
                    height: 8,
                    borderRadius: 2,
                    backgroundColor: "#fbbf24",
                    opacity: 1,
                  }}
                />
              ))}
            </View>
          ))}

          {/* Speed streak trailing behind it (the train travels leftwards) */}
          <LinearGradient
            colors={[`${glow}99`, "transparent"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ width: TRAIL_W, height: 6, marginLeft: 4, alignSelf: "center", borderRadius: 3 }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

export default memo(TrainFlash);
