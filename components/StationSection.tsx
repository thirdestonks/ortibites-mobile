import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import type { Place } from "../types/place";
import { DURATION, EASE_OUT } from "../utils/motion";
import { GUTTER, NODE, RAIL_X } from "../utils/spine";
import type { LineColor } from "../utils/lineColors";
import { mono } from "./receipt";
import MetroCard from "./MetroCard";

type Props = {
  label: string;
  places: Place[];
  onRevisit: (id: number) => void;
  onUndoRevisit: (id: number, currentCount: number) => void;
  sectionIndex: number;
  lineColor: LineColor;
};

/**
 * One stop on the line: a pin sitting on the rail, its label, and the cards
 * hanging off to the right. The rail itself is drawn once by SpineRail behind
 * every section, so nothing here draws track.
 */
export default function StationSection({
  label,
  places,
  onRevisit,
  onUndoRevisit,
  sectionIndex,
  lineColor,
}: Props) {
  const isEmpty = places.length === 0;

  return (
    <View className="relative w-full">
      {/* Station pin + label. The pin sits ON the rail; the label hangs right. */}
      <Animated.View
        entering={FadeInDown.delay(sectionIndex * 150)
          .duration(DURATION.slow)
          .easing(EASE_OUT)}
        className="w-full flex-row items-center py-3"
        style={{ paddingLeft: GUTTER }}
      >
        <View
          className="absolute items-center justify-center rounded-full"
          style={{
            left: RAIL_X - NODE / 2,
            width: NODE,
            height: NODE,
            backgroundColor: lineColor.bg,
            borderWidth: 3,
            borderColor: "#09090b", // zinc-950, so the rail reads as passing behind
          }}
        >
          <MaterialIcons name="train" size={17} color={lineColor.ink} />
        </View>
        <Text className="flex-1 text-xl font-extrabold uppercase tracking-widest text-zinc-100">
          {label}
        </Text>
        {!isEmpty && (
          <Text
            style={mono}
            className="text-[10px] font-bold uppercase tracking-widest text-zinc-500"
          >
            {places.length}
          </Text>
        )}
      </Animated.View>

      {/* Stations with nothing saved collapse to one quiet row instead of a gap */}
      {isEmpty ? (
        <View style={{ paddingLeft: GUTTER }} className="pb-3">
          <Text
            style={mono}
            className="text-[10px] uppercase tracking-widest text-zinc-600"
          >
            no spot yet
          </Text>
        </View>
      ) : (
        <View style={{ paddingLeft: GUTTER }} className="pb-2">
          {places.map((place, i) => (
            <Animated.View
              key={place.id}
              entering={FadeInDown.delay(sectionIndex * 150 + (i + 1) * 90)
                .duration(DURATION.slow)
                .easing(EASE_OUT)}
              className="pb-3"
            >
              <MetroCard
                place={place}
                onRevisit={onRevisit}
                onUndoRevisit={onUndoRevisit}
                lineColor={lineColor}
              />
            </Animated.View>
          ))}
        </View>
      )}
    </View>
  );
}
