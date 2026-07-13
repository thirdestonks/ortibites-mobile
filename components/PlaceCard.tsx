import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import type { Place } from "../types/place";
import { getRatingMeta } from "../utils/rating";
import { STAGGER_MS, DURATION, EASE_OUT } from "../utils/motion";
import { useGuardedPush } from "../utils/navigation";
import { mono, ReceiptEdge, ReceiptHeader, ReceiptLine } from "./receipt";

interface PlaceCardProps {
  place: Place;
  index?: number;
}

function formatVisited(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = String(d.getFullYear()).slice(-2);
  return `${month} '${year}`.toUpperCase();
}

export default function PlaceCard({ place, index = 0 }: PlaceCardProps) {
  const push = useGuardedPush();

  const rating = place.rating ?? 0;
  const meta = getRatingMeta(rating);
  const filled = Math.round(rating);
  const visited = formatVisited(place.visited_at ?? place.created_at);
  const dish = place.favorite_dishes?.[0];
  const orderNo = `#${String(place.id).padStart(4, "0")}`;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * STAGGER_MS)
        .duration(DURATION.base)
        .easing(EASE_OUT)}
      className="mb-4"
    >
      <Pressable
        onPress={() => push(`/place/${place.id}`)}
        style={({ pressed }) => ({
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <ReceiptEdge dir="top" />

        <View className="bg-zinc-900 px-5 pb-4 pt-2">
          <ReceiptHeader caption="DINER" />

          {/* META */}
          <View className="mt-3 flex-row justify-between">
            <Text style={mono} className="text-xs text-zinc-500">
              {visited ?? "—"}
            </Text>
            <Text style={mono} className="text-xs text-zinc-500">
              {orderNo}
            </Text>
          </View>

          <View className="my-2 border-t border-dashed border-zinc-700" />

          {/* ITEM */}
          <Text
            style={mono}
            className="text-base font-bold text-amber-100"
            numberOfLines={1}
          >
            {place.name.toUpperCase()}
          </Text>

          <View className="mt-1 flex-row">
            {[1, 2, 3, 4, 5].map((n) => (
              <Text
                key={n}
                style={mono}
                className={n <= filled ? "text-amber-400" : "text-zinc-700"}
              >
                ★
              </Text>
            ))}
          </View>

          {dish ? <ReceiptLine label="DISH" value={dish} /> : null}
          {place.address ? (
            <ReceiptLine label="LOC" value={place.address} />
          ) : null}

          <View className="my-2 border-t border-dashed border-zinc-700" />

          <ReceiptLine label="RATING" value={`${rating}/5`} />

          {/* SENTIMENT STAMP */}
          <Text
            style={mono}
            className={`mt-2 text-center text-xs font-bold ${meta.color}`}
          >
            [ {meta.label} ]
          </Text>
        </View>

        <ReceiptEdge dir="bottom" />
      </Pressable>
    </Animated.View>
  );
}
