import "../global.css";

import { useEffect } from "react";
import { Stack } from "expo-router";
import { View } from "react-native";
import Toast from "react-native-toast-message";

import { useAuthStore } from "../stores/authStore";
import PageLoader from "../components/PageLoader";

export default function RootLayout() {
  const init = useAuthStore((s) => s.init);
  const loading = useAuthStore((s) => s.loading);

  useEffect(() => {
    init();
  }, [init]);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <View className="flex-1 bg-zinc-950">
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
      <Toast />
    </View>
  );
}
