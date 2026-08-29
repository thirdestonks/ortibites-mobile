import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import Mascot, { type MascotPose } from "./Mascot";
import { mono } from "./receipt";

/**
 * May with a speech bubble. Same mascot art and poses as everywhere else; this
 * only gives her a line to say so she reads as reacting to the screen rather
 * than decorating it.
 */
export default function MascotSays({
  pose,
  line,
  size = 96,
}: {
  pose: MascotPose;
  line: string;
  size?: number;
}) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      <Mascot pose={pose} size={size} />

      <Animated.View
        key={line}
        entering={FadeIn.duration(260)}
        className="relative max-w-[62%] rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2.5"
      >
        {/* Tail pointing back at May */}
        <View
          className="absolute -left-1.5 h-3 w-3 rotate-45 border-b border-l border-zinc-800 bg-zinc-900"
          style={{ top: "50%", marginTop: -6 }}
        />
        <Text style={mono} className="text-[11px] leading-4 text-zinc-300">
          {line}
        </Text>
      </Animated.View>
    </View>
  );
}
