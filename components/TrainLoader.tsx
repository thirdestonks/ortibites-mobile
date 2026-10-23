import { memo, useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { mono } from "./receipt";

const TRACK_W = 230;
const STOPS = 4;

const THEMES = {
  // On the cream paper (splash, login)
  light: {
    track: "#e3d395",
    fill: "#f5a31a",
    stopRing: "#cdbb78",
    stopFill: "#fcefb4",
    stopOn: "#f5a31a",
    car: "#14152b",
    window: "#fff2b8",
    label: "#2b2418",
    glow: "#f5a31a",
  },
  // On the app's dark background
  dark: {
    track: "#3a3020",
    fill: "#fbbf24",
    stopRing: "#5a4a2a",
    stopFill: "#17120b",
    stopOn: "#fbbf24",
    car: "#fff4d6",
    window: "#14152b",
    label: "#fbbf24",
    glow: "#fbbf24",
  },
} as const;

function Stop({
  index,
  progress,
  theme,
}: {
  index: number;
  progress: SharedValue<number>;
  theme: (typeof THEMES)[keyof typeof THEMES];
}) {
  const on = useAnimatedStyle(() => ({
    opacity: progress.value >= index / (STOPS - 1) - 0.02 ? 1 : 0,
  }));

  return (
    <View
      style={{
        position: "absolute",
        left: `${(index / (STOPS - 1)) * 100}%`,
        top: -6,
        marginLeft: -7.5,
        width: 15,
        height: 15,
        borderRadius: 7.5,
        borderWidth: 3,
        borderColor: theme.stopRing,
        backgroundColor: theme.stopFill,
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: -3,
            left: -3,
            width: 15,
            height: 15,
            borderRadius: 7.5,
            backgroundColor: theme.stopOn,
          },
          on,
        ]}
      />
    </View>
  );
}

/**
 * Loading indicator in the app's own language: a little train that runs from
 * stop to stop along a line, pausing at each, then starts over. Moves on the
 * UI thread, so it keeps going while the JS thread is busy fetching.
 */
function TrainLoader({
  variant = "dark",
  label,
}: {
  variant?: "light" | "dark";
  label?: string;
}) {
  const theme = THEMES[variant];
  const progress = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    const leg = { duration: 650, easing: Easing.inOut(Easing.cubic) };
    progress.value = withRepeat(
      withSequence(
        withDelay(250, withTiming(1 / 3, leg)),
        withDelay(280, withTiming(2 / 3, leg)),
        withDelay(280, withTiming(1, leg)),
        withDelay(420, withTiming(0, { duration: 0 }))
      ),
      -1
    );
    pulse.value = withRepeat(withTiming(1, { duration: 1100 }), -1, true);
  }, [progress, pulse]);

  // Translate instead of animating width so nothing re-lays-out per frame.
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (progress.value - 1) * TRACK_W }],
  }));
  const trainStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * TRACK_W }],
  }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: 0.45 + 0.55 * pulse.value }));

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: TRACK_W, height: 28, justifyContent: "center" }}>
        <View
          style={{ height: 3, borderRadius: 2, backgroundColor: theme.track }}
        >
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Animated.View
              style={[{ height: 3, width: TRACK_W, backgroundColor: theme.fill }, fillStyle]}
            />
          </View>

          {Array.from({ length: STOPS }).map((_, i) => (
            <Stop key={i} index={i} progress={progress} theme={theme} />
          ))}

          {/* the train: a head car and a trailing car */}
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                top: -10,
                left: -26,
                flexDirection: "row",
                gap: 3,
                shadowColor: theme.glow,
                shadowOpacity: 0.8,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 0 },
                elevation: 6,
              },
              trainStyle,
            ]}
          >
            {[0, 1].map((c) => (
              <View
                key={c}
                style={{
                  width: 24,
                  height: 17,
                  borderRadius: 5,
                  backgroundColor: theme.car,
                  flexDirection: "row",
                  alignItems: "flex-start",
                  justifyContent: "space-evenly",
                  paddingTop: 4,
                }}
              >
                {[0, 1, 2].map((w) => (
                  <View
                    key={w}
                    style={{ width: 5, height: 5, borderRadius: 1.5, backgroundColor: theme.window }}
                  />
                ))}
              </View>
            ))}
          </Animated.View>
        </View>
      </View>

      {label ? (
        <Animated.View style={[{ marginTop: 14 }, labelStyle]}>
          <Text
            style={[
              mono,
              { color: theme.label, fontSize: 11, fontWeight: "800", letterSpacing: 3 },
            ]}
          >
            {label}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

export default memo(TrainLoader);
