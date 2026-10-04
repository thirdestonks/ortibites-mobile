import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { GUTTER, RAIL_W, RAIL_X, travelDuration } from "../utils/spine";
import { mono } from "./receipt";

const AMBER = "#f59e0b";
const DIM = "#52525b"; // zinc-600

/**
 * Length of the dimmed wake around the train. The grey core is small; most of
 * this is the fade back to amber on either side.
 */
const BAND = 128;

/** How far the headlight travels while fading in at the top / out at the bottom. */
const FADE = 46;

/**
 * The track, drawn once behind the whole line.
 *
 * The rail is amber along its entire length. What moves is a short *dimmed*
 * window carried by the train, so the light appears to be briefly swallowed as
 * it passes. This is the inverse of lighting a growing trail, and it is what
 * makes the loop seamless: the band starts fully above the track and ends fully
 * below it, and both of those states look identical (a solid amber line), so
 * the wrap from the end of one run to the start of the next is invisible.
 */
export default function SpineRail({ height }: { height: number }) {
  const progress = useSharedValue(0);
  const duration = travelDuration(height);

  useEffect(() => {
    progress.value = 0;
    // Linear and gapless. Any easing would slow the train at the wrap point,
    // and any pause would betray where the loop restarts.
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1,
      false
    );
  }, [duration, progress]);

  // Travels from entirely off the top to entirely off the bottom. The band has
  // to overshoot the rail at both ends or the loop stops being seamless.
  const trainStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -BAND + progress.value * (height + BAND) }],
  }));

  // The headlight rides the same run, but it renders unclipped, so it would be
  // visible floating above and below the rail during that overshoot. Fade it
  // against its own position on the track instead: invisible until it reaches
  // the top of the line, invisible again once it passes the bottom.
  const headStyle = useAnimatedStyle(() => {
    // Before onLayout reports a height, keep the fade range monotonic.
    const h = Math.max(height, FADE * 3);
    const y = -BAND / 2 + progress.value * (h + BAND);
    return {
      transform: [{ translateY: y - 8 }],
      opacity: interpolate(
        y,
        [0, FADE, h - FADE, h],
        [0, 1, 1, 0],
        Extrapolation.CLAMP
      ),
    };
  });

  return (
    <View className="absolute inset-0" pointerEvents="none">
      {/* Amber rail. The dimming band is clipped to the track's width. */}
      <View
        className="absolute bottom-0 top-0 overflow-hidden"
        style={{
          left: RAIL_X - RAIL_W / 2,
          width: RAIL_W,
          backgroundColor: AMBER,
        }}
      >
        <Animated.View
          style={[{ position: "absolute", left: 0, right: 0, height: BAND }, trainStyle]}
        >
          <LinearGradient
            colors={["rgba(82,82,91,0)", DIM, DIM, "rgba(82,82,91,0)"]}
            locations={[0, 0.42, 0.58, 1]}
            style={{ flex: 1 }}
          />
        </Animated.View>
      </View>

      {/* Headlight, in its own unclipped layer so its glow isn't cut to the
          4px rail. Positioned at the centre of the dimmed window. */}
      <Animated.View
        style={[
          { position: "absolute", left: RAIL_X - 8, top: 0, width: 16, height: 16 },
          headStyle,
        ]}
      >
        <View
          className="rounded-full bg-amber-100"
          style={{
            width: 16,
            height: 16,
            shadowColor: "#fbbf24",
            shadowRadius: 10,
            shadowOpacity: 0.9,
            shadowOffset: { width: 0, height: 0 },
            elevation: 6,
          }}
        />
      </Animated.View>
    </View>
  );
}

/**
 * Buffer stop that closes the line, so the rail terminates deliberately
 * instead of just running out of content.
 */
export function TrackEnd({ stops }: { stops: number }) {
  return (
    <View className="w-full pt-1" style={{ paddingLeft: GUTTER }}>
      {/* Last few metres of track, matching the amber rail above */}
      <View
        className="absolute"
        style={{
          left: RAIL_X - RAIL_W / 2,
          top: 0,
          width: RAIL_W,
          height: 14,
          backgroundColor: AMBER,
        }}
      />
      {/* Buffer stop: wide bar over a narrow one */}
      <View
        className="absolute rounded-sm bg-amber-500"
        style={{ left: RAIL_X - 14, top: 14, width: 28, height: 5 }}
      />
      <View
        className="absolute rounded-sm bg-zinc-600"
        style={{ left: RAIL_X - 6, top: 19, width: 12, height: 4 }}
      />

      <View className="pt-2.5">
        <Text
          style={mono}
          className="text-[10px] font-bold uppercase tracking-[3px] text-zinc-500"
        >
          End of line
        </Text>
        <Text
          style={mono}
          className="mt-0.5 text-[9px] uppercase tracking-widest text-zinc-700"
        >
          {stops} {stops === 1 ? "station" : "stations"} · terminus
        </Text>
      </View>
    </View>
  );
}
