import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { useAuthStore } from "../../stores/authStore";
import { showErrorToast, showSuccessToast } from "../../components/Toast";
import ScreenWrapper from "../../components/ScreenWrapper";
import ScreenHeader from "../../components/ScreenHeader";
import AppButton from "../../components/AppButton";

export default function LoginScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

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

    // On success, onAuthStateChange flips the session and the guard routes us in.
    showSuccessToast(
      "Welcome",
      mode === "signin" ? "Logged in!" : "Account created!"
    );
  };

  return (
    <ScreenWrapper scroll>
      <ScreenHeader title="ORTIBITES" subtitle="log in to your food memories 🍜" />

      <View className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
        {/* EMAIL */}
        <View className="mb-6">
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

        {/* PASSWORD */}
        <View className="mb-8">
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
          title={busy ? "PLEASE WAIT…" : mode === "signin" ? "LOG IN" : "SIGN UP"}
          onPress={handleSubmit}
        />

        <Text
          onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 text-center text-sm font-semibold text-zinc-400"
        >
          {mode === "signin" ? "No account? Sign up" : "Have an account? Log in"}
        </Text>
      </View>
    </ScreenWrapper>
  );
}
