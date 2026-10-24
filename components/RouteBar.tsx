import React, { useEffect, useRef } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
  type ScrollViewInstance,
} from "react-native";

import type { LineColor } from "../utils/lineColors";
import { mono } from "./receipt";

export type RouteStop = { key: string; label: string; color: LineColor };

/** Height the bar occupies, so scroll-to-station can leave room for it. */
export const ROUTE_BAR_H = 58;

const ITEM_W = 72;
const DOT = 16;
const AMBER = "#fbbf24";
// Same cream ink the old network map used, legible on the dark mapcardOne texture.
const INK = "#f3ead4";

/**
 * The network map, shrunk to a strip that pins to the top while the line
 * scrolls underneath. The station you're currently on lights up, and tapping
 * one jumps there.
 */
export default function RouteBar({
  stops,
  activeKey,
  onSelect,
  onEdit,
}: {
  stops: RouteStop[];
  activeKey: string | null;
  onSelect: (key: string) => void;
  onEdit: () => void;
}) {
  const scrollRef = useRef<ScrollViewInstance>(null);

  // Keep the active station in view as the list scrolls past it.
  useEffect(() => {
    const i = stops.findIndex((s) => s.key === activeKey);
    if (i >= 0) scrollRef.current?.scrollTo({ x: Math.max(0, i * ITEM_W - 110), animated: true });
  }, [activeKey, stops]);

  return (
    <ImageBackground
      source={require("../assets/images/mapcardOne.jpg")}
      resizeMode="repeat"
      imageStyle={{ borderRadius: 16 }}
      style={{
        height: ROUTE_BAR_H,
        flexDirection: "row",
        alignItems: "center",
        overflow: "hidden",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(251,191,36,0.3)",
        paddingLeft: 4,
        paddingRight: 8,
      }}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-1"
      >
        {stops.map((s, i) => {
          const on = s.key === activeKey;
          return (
            <Pressable
              key={s.key}
              onPress={() => onSelect(s.key)}
              style={{ width: ITEM_W, alignItems: "center", paddingTop: 10 }}
            >
              {/* the line between stations, drawn as two halves so ends stay clean */}
              {i > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: 10 + DOT / 2 - 1.5,
                    left: 0,
                    width: ITEM_W / 2,
                    height: 3,
                    backgroundColor: INK,
                    opacity: 0.55,
                  }}
                />
              )}
              {i < stops.length - 1 && (
                <View
                  style={{
                    position: "absolute",
                    top: 10 + DOT / 2 - 1.5,
                    right: 0,
                    width: ITEM_W / 2,
                    height: 3,
                    backgroundColor: INK,
                    opacity: 0.55,
                  }}
                />
              )}
              <View
                style={{
                  width: DOT + 6,
                  height: DOT + 6,
                  borderRadius: (DOT + 6) / 2,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: on ? 1.5 : 0,
                  borderColor: AMBER,
                  marginTop: -3,
                }}
              >
                <View
                  style={{
                    width: DOT,
                    height: DOT,
                    borderRadius: DOT / 2,
                    backgroundColor: s.color.bg,
                    borderWidth: 1.5,
                    borderColor: INK,
                  }}
                />
              </View>
              <Text
                numberOfLines={1}
                style={[mono, { color: on ? AMBER : INK, opacity: on ? 1 : 0.7, maxWidth: ITEM_W - 4 }]}
                className="mt-1 text-[8.5px] font-bold uppercase tracking-wider"
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        onPress={onEdit}
        hitSlop={8}
        className="ml-1 rounded-full border border-amber-400/40 px-3 py-1"
      >
        <Text
          style={mono}
          className="text-[9px] font-bold uppercase tracking-widest text-amber-400"
        >
          Edit
        </Text>
      </Pressable>
    </ImageBackground>
  );
}
