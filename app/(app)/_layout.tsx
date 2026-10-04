import { Redirect, Stack } from "expo-router";
import { View } from "react-native";

import { useAuthStore } from "../../stores/authStore";
import FabMenu from "../../components/FabMenu";

export default function AppLayout() {
  const session = useAuthStore((s) => s.session);

  // Logged-out users can't be here — bounce to login.
  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <View className="flex-1 bg-zinc-950">
      <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        <Stack.Screen name="create" options={{ animation: "slide_from_bottom" }} />
      </Stack>
      {/* Shown on every screen including Wrapped. The old full-width bar was
          excluded there to protect the story layout; a single corner button
          isn't intrusive enough to justify stranding the user. */}
      <FabMenu />
    </View>
  );
}
