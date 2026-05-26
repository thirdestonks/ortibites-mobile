import "../global.css";

import { Stack } from "expo-router";
import { View } from "react-native";
import Toast from "react-native-toast-message";
import BottomNav from "../components/BottomNav";

export default function Layout() {
  return (
    // Put View before Stack to prevent flicker when clicking <--- button
    <View className="flex-1 bg-zinc-950">
      <Stack
        screenOptions={{
          headerShown: false,
              animation: "fade",
        }}
      />
      <BottomNav />
      <Toast />
    </View>
  );
}