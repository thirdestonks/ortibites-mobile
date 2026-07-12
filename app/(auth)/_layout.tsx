import { Redirect, Stack } from "expo-router";

import { useAuthStore } from "../../stores/authStore";

export default function AuthLayout() {
  const session = useAuthStore((s) => s.session);

  // Already logged in — no reason to see the login screen.
  if (session) {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}
