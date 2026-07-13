import { useEffect, useState } from "react";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useAuthStore } from "../../stores/authStore";
import { showErrorToast, showSuccessToast } from "../../components/Toast";
import AppButton from "../../components/AppButton";
import GlowDots from "../../components/GlowDots";

export default function LoginScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(withTiming(1, { duration: 3000 }), -1, true);
  }, [glow]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.28 * glow.value,
  }));

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      showErrorToast("Missing info", "Enter email and password.");
      return;
    }

    setBusy(true);
    const { error } =
      mode === "signin"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
    setBusy(false);

    if (error) {
      showErrorToast("Auth error", error);
      return;
    }

    showSuccessToast(
      "Welcome",
      mode === "signin" ? "Logged in!" : "Account created!"
    );
  };

  return (
    <ImageBackground
      source={require("../../assets/images/bgg.png")}
      resizeMode="cover"
      className="flex-1"
    >
      <View className="flex-1 bg-black/70">
        <GlowDots />

        <KeyboardAvoidingView
          className="flex-1 justify-center px-8"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* HERO */}
          <View className="mb-10 items-center">
            <Text className="text-6xl">🍜</Text>
            <Text
              className="mt-3 text-5xl font-black tracking-widest text-white"
              style={{
                textShadowColor: "rgba(239,68,68,0.9)",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 16,
              }}
            >
              ORTIBITES
            </Text>
            <Text className="mt-2 text-zinc-300">your food memories 🍜</Text>
          </View>

          {/* FORM CARD */}
          <View className="relative">
            <Animated.View
              style={haloStyle}
              className="absolute -bottom-4 left-1 right-1 top-8 rounded-3xl bg-red-500"
            />
            <View className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
            <View className="mb-5">
              <Text className="mb-2 text-sm font-bold uppercase tracking-widest text-amber-400">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#71717a"
                autoCapitalize="none"
                keyboardType="email-address"
                className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-white"
              />
            </View>

            <View className="mb-7">
              <Text className="mb-2 text-sm font-bold uppercase tracking-widest text-amber-400">
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#71717a"
                secureTextEntry
                className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-white"
              />
            </View>

            <AppButton
              title={
                busy ? "PLEASE WAIT…" : mode === "signin" ? "LOG IN" : "SIGN UP"
              }
              onPress={handleSubmit}
            />

            <Text
              onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-5 text-center text-sm font-semibold text-zinc-400"
            >
              {mode === "signin"
                ? "No account? Sign up"
                : "Have an account? Log in"}
            </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}
