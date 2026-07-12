import { Redirect, Stack } from "expo-router";
import { View } from "react-native";

import { useAuthStore } from "../../stores/authStore";
import BottomNav from "../../components/BottomNav";

export default function AppLayout() {
  const session = useAuthStore((s) => s.session);

  // Logged-out users can't be here — bounce to login.
  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <View className="flex-1 bg-zinc-950">
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
      <BottomNav />
    </View>
  );
}
