import { Text, View } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

import { SIGN_WORD } from "./useSignFlash";

/** The four line colours, used as little badges on the sign. */
const LINE_DOTS = ["#2fa23a", "#e10f1d", "#f5a31a", "#5ba4d9"];

const PLATE = "#120f09";
const PLATE_EDGE = "#6b5320";
const CREAM = "#fff4d6";
const DIM = "#8f8460"; // an unlit letter: still readable, just not glowing
const AMBER = "#fbbf24";

const WORD = {
  fontSize: 42,
  fontWeight: "900" as const,
};

function Letter({ ch, lit }: { ch: string; lit?: SharedValue<number> }) {
  const glow = useAnimatedStyle(() => ({ opacity: lit ? lit.value : 0 }));

  return (
    <View style={{ marginHorizontal: 1.5 }}>
      <Text style={[WORD, { color: DIM }]}>{ch}</Text>
      {/* the same letter, lit, faded in and out over the top */}
      <Animated.Text
        style={[
          WORD,
          {
            position: "absolute",
            left: 0,
            top: 0,
            color: CREAM,
            textShadowColor: AMBER,
            textShadowRadius: 18,
            textShadowOffset: { width: 0, height: 0 },
          },
          glow,
        ]}
      >
        {ch}
      </Animated.Text>
    </View>
  );
}

/**
 * The ORTIBITES name as a metro station sign: letters on a dark plate with an
 * amber edge. `letters` holds one 0..1 value per letter (see useSignFlash);
 * each letter glows and beams on its own, and `ring` lights the plate edge.
 */
export default function StationSign({
  letters,
  ring,
  tagline,
}: {
  letters?: SharedValue<number>[];
  ring?: SharedValue<number>;
  tagline?: string;
}) {
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring ? Math.min(1, ring.value * 1.6) : 0,
  }));

  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{
          backgroundColor: PLATE,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: PLATE_EDGE,
          paddingHorizontal: 18,
          paddingTop: 10,
          paddingBottom: 12,
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 4 }}>
          {LINE_DOTS.map((c) => (
            <View key={c} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
          ))}
        </View>

        <View style={{ flexDirection: "row" }}>
          {Array.from(SIGN_WORD).map((ch, i) => (
            <Letter key={i} ch={ch} lit={letters?.[i]} />
          ))}
        </View>

        {/* the plate's edge glows with the letters */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: AMBER,
              shadowColor: AMBER,
              shadowOpacity: 0.9,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 0 },
              elevation: 6,
            },
            ringStyle,
          ]}
        />
      </View>

      {tagline ? (
        <Text
          style={{
            marginTop: 12,
            color: "#b9a97e",
            fontSize: 13,
            letterSpacing: 2,
            fontWeight: "600",
          }}
        >
          {tagline}
        </Text>
      ) : null}
    </View>
  );
}
