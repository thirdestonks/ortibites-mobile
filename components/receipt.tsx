import { Platform, Text, View } from "react-native";

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
