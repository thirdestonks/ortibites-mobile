import { Text, View } from "react-native";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  subtitle?: string;
}

export default function EmptyState({
  emoji = "🍽️",
  title,
  subtitle,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-7xl">{emoji}</Text>

      <Text className="mt-5 text-lg font-bold tracking-[6px] text-amber-400">
        {title}
      </Text>

      {subtitle ? (
        <Text className="mt-2 text-zinc-400">{subtitle}</Text>
      ) : null}
    </View>
  );
}
