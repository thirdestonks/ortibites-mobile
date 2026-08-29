import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthStore } from "../stores/authStore";
import { useGuardedPush } from "../utils/navigation";
import { PRESS_SPRING } from "../utils/motion";
import { mono } from "./receipt";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type IconName = keyof typeof Ionicons.glyphMap;

type Action = {
  key: string;
  label: string;
  icon: IconName;
  route?: string;
};

// Listed top-to-bottom as they appear on screen. The item nearest the button
// (last in this list) reveals first, so the menu unrolls away from the thumb.
const ACTIONS: Action[] = [
  { key: "logout", label: "Log out", icon: "log-out-outline" },
  { key: "memory", label: "Memory", icon: "time-outline", route: "/wrapped" },
  { key: "decide", label: "Decide for me", icon: "dice-outline", route: "/roulette" },
  { key: "create", label: "Add a spot", icon: "add", route: "/create" },
];

// Off the metro screen there is no other way back, so the menu grows a Home
// entry and puts it nearest the thumb.
const HOME_ACTION: Action = {
  key: "home",
  label: "Back to the line",
  icon: "home",
  route: "/",
};

function FabItem({
  action,
  open,
  delay,
  onPress,
}: {
  action: Action;
  open: boolean;
  delay: number;
  onPress: () => void;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = open
      ? withDelay(delay, withSpring(1, { damping: 14, stiffness: 220, mass: 0.6 }))
      : withTiming(0, { duration: 120 });
  }, [open, delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      // Bigger rows need a longer travel or the stagger reads as a twitch.
      { translateY: (1 - progress.value) * 24 },
      { scale: 0.92 + progress.value * 0.08 },
    ],
  }));

  return (
    <Animated.View style={style} pointerEvents={open ? "auto" : "none"}>
      {/* The scrim fully covers the screen behind this, so the menu can be
          generously sized without competing with page content. */}
      <Pressable onPress={onPress} className="flex-row items-center gap-3">
        <View className="rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-3.5">
          <Text
            style={mono}
            className="text-[15px] font-bold uppercase tracking-widest text-zinc-100"
          >
            {action.label}
          </Text>
        </View>
        <View className="h-[58px] w-[58px] items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900">
          <Ionicons name={action.icon} size={26} color="#fbbf24" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Single floating button that unrolls the app's four destinations. Replaces the
 * old full-width BottomNav so the screen keeps ~90px more visible content.
 */
export default function FabMenu() {
  const [open, setOpen] = useState(false);
  const push = useGuardedPush();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const signOut = useAuthStore((s) => s.signOut);

  const onHome = pathname === "/";
  const actions = onHome ? ACTIONS : [...ACTIONS, HOME_ACTION];

  // Clears the Android 3-button navigation bar (or the iOS home indicator)
  // rather than assuming gesture nav and sitting on top of it.
  const bottom = insets.bottom + 24;

  const scale = useSharedValue(1);
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withSpring(open ? 1 : 0, { damping: 14, stiffness: 200, mass: 0.6 });
  }, [open, spin]);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${spin.value * 90}deg` }],
  }));

  const run = (action: Action) => {
    setOpen(false);
    if (action.key === "logout") signOut();
    else if (action.route) push(action.route);
  };

  return (
    <View className="absolute inset-0" pointerEvents="box-none">
      {open && (
        <AnimatedPressable
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(140)}
          onPress={() => setOpen(false)}
          className="absolute inset-0 bg-black/85"
        />
      )}

      <View
        className="absolute right-5 items-end gap-3"
        style={{ bottom }}
        pointerEvents="box-none"
      >
        {actions.map((action, i) => (
          <FabItem
            key={action.key}
            action={action}
            open={open}
            // Reversed: the bottom-most item (nearest the button) leads.
            delay={(actions.length - 1 - i) * 45}
            onPress={() => run(action)}
          />
        ))}

        <AnimatedPressable
          onPress={() => setOpen((v) => !v)}
          onPressIn={() => (scale.value = withSpring(0.9, PRESS_SPRING))}
          onPressOut={() => (scale.value = withSpring(1, PRESS_SPRING))}
          className="h-16 w-16 items-center justify-center rounded-3xl bg-amber-400"
          style={[
            fabStyle,
            {
              shadowColor: "#fbbf24",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5,
              shadowRadius: 18,
              elevation: 10,
            },
          ]}
        >
          <Ionicons name={open ? "close" : "menu"} size={30} color="#0b0d11" />
        </AnimatedPressable>
      </View>
    </View>
  );
}
