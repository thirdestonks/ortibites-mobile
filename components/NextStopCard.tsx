import React from "react";
import { Pressable, Text, View } from "react-native";

import type { Place } from "../types/place";
import { useGuardedPush } from "../utils/navigation";
import Mascot from "./Mascot";
import { mono } from "./receipt";

/**
 * "Next stop?": May points at the best-rated spot you've never been to, with a
 * shortcut to Decide for me so the question gets answered before scrolling.
 * Renders nothing when every saved spot has been visited.
 */
export function pickNextStop(places: Place[]): Place | null {
  const fresh = places.filter((p) => (p.revisit_count ?? 0) === 0);
  if (fresh.length === 0) return null;
  return [...fresh].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];
}

export default function NextStopCard({ place }: { place: Place }) {
  const push = useGuardedPush();
  const filled = Math.round(place.rating ?? 0);

  return (
    <View className="flex-row items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/90 py-3 pl-1 pr-3">
      <Mascot pose="thinking" size={74} />
      <View className="flex-1">
        <Text
          style={mono}
          className="text-[9px] font-bold uppercase tracking-[.22em] text-amber-400"
        >
          Next stop?
        </Text>
        <Text
          numberOfLines={1}
          className="mt-1 text-xl font-black uppercase tracking-wide text-zinc-100"
        >
          {place.name}
        </Text>
        <Text style={mono} className="mt-0.5 text-[9.5px] text-zinc-500">
          {"★".repeat(filled) || "unrated"} · never been
        </Text>
        <View className="mt-2.5 flex-row gap-2">
          <Pressable
            onPress={() => push("/roulette")}
            className="rounded-full bg-amber-400 px-3 py-1.5"
          >
            <Text
              style={mono}
              className="text-[9px] font-extrabold uppercase tracking-widest text-black"
            >
              Decide for me
            </Text>
          </Pressable>
          <Pressable
            onPress={() => push(`/place/${place.id}`)}
            className="rounded-full border border-amber-400/40 px-3 py-1.5"
          >
            <Text
              style={mono}
              className="text-[9px] font-extrabold uppercase tracking-widest text-amber-400"
            >
              View
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
