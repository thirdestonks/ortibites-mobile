import type { ReactNode } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { WrappedPeriod } from "../lib/wrappedStats";

export const MONO = Platform.select({
  ios: "Courier",
  android: "monospace",
  default: "monospace",
});
export const mono = { fontFamily: MONO };

const CARD = "#18181b"; // zinc-900

export function ReceiptEdge({ dir }: { dir: "top" | "bottom" }) {
  const base = {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  } as const;

  return (
    <View className="flex-row overflow-hidden" style={{ height: 8 }}>
      {Array.from({ length: 40 }).map((_, i) => (
        <View
          key={i}
          style={
            dir === "bottom"
              ? { ...base, borderTopWidth: 8, borderTopColor: CARD }
              : { ...base, borderBottomWidth: 8, borderBottomColor: CARD }
          }
        />
      ))}
    </View>
  );
}

export function ReceiptHeader({ caption }: { caption: string }) {
  return (
    <View>
      <Text
        style={mono}
        className="text-center text-sm font-bold text-amber-400"
      >
        ★ ORTIBITES ★
      </Text>
      <Text style={mono} className="text-center text-xs text-zinc-500">
        ---- {caption} ----
      </Text>
    </View>
  );
}

export function DashDivider() {
  return <View className="my-3 border-t border-dashed border-zinc-700" />;
}

export function ReceiptLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View className="mt-1 flex-row items-center">
      <Text style={mono} className="text-xs text-zinc-400">
        {label}
      </Text>
      <View className="mx-2 flex-1 border-b border-dashed border-zinc-700" />
      <Text style={mono} className="text-xs text-zinc-300" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function PeriodToggle({
  period,
  onChange,
}: {
  period: WrappedPeriod;
  onChange: (period: WrappedPeriod) => void;
}) {
  // RN clips the final glyph when letterSpacing is applied inside a flex-sized
  // box, so these labels use padding + shrink-to-fit instead of tracking-*.
  const labelStyle = { ...mono, letterSpacing: 0.5 };

  const Tab = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center rounded-full px-1 py-2 ${
        active ? "bg-amber-400" : ""
      }`}
    >
      <Text
        style={labelStyle}
        numberOfLines={1}
        adjustsFontSizeToFit
        className={`text-xs font-bold ${
          active ? "text-black" : "text-zinc-400"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View className="flex-row items-center rounded-full border border-zinc-700 bg-zinc-900/80 p-1">
      <Tab
        label="WEEKLY"
        active={period === "weekly"}
        onPress={() => onChange("weekly")}
      />
      <Tab
        label="MONTHLY"
        active={period === "monthly"}
        onPress={() => onChange("monthly")}
      />
      <View className="flex-1 flex-row items-center justify-center gap-1 rounded-full px-1 py-2 opacity-40">
        <Ionicons name="lock-closed" size={10} color="#a1a1aa" />
        <Text
          style={labelStyle}
          numberOfLines={1}
          adjustsFontSizeToFit
          className="text-xs font-bold text-zinc-500"
        >
          YEARLY
        </Text>
      </View>
    </View>
  );
}

/** A stat card styled like a ticket/paper pinned to a corkboard. */
export function PinnedCard({
  rotate = 0,
  children,
}: {
  rotate?: number;
  children: ReactNode;
}) {
  return (
    <View
      style={{ transform: [{ rotate: `${rotate}deg` }] }}
      className="rounded-2xl border-2 border-amber-400/70 bg-zinc-900 px-5 py-4 shadow-lg shadow-black"
    >
      <View className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border border-amber-200/60 bg-amber-400" />
      {children}
    </View>
  );
}
