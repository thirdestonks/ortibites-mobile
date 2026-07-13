import "../global.css";

import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { View } from "react-native";
import Toast from "react-native-toast-message";

import { useAuthStore } from "../stores/authStore";
import AppSplash from "../components/AppSplash";

export default function RootLayout() {
  const init = useAuthStore((s) => s.init);
  const loading = useAuthStore((s) => s.loading);

  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Splash shows until the 2s minimum has passed AND auth has resolved.
  const showSplash = !minElapsed || loading;

  return (
    <View className="flex-1 bg-zinc-950">
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
      <Toast />
      {showSplash ? <AppSplash /> : null}
    </View>
  );
}
