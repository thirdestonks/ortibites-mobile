import { memo, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputInstance,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthStore } from "../../stores/authStore";
import { showErrorToast, showSuccessToast } from "../../components/Toast";
import Mascot, { type MascotPose } from "../../components/Mascot";
import { mono } from "../../components/receipt";
import TrainFlash from "../../components/TrainFlash";
import MetroBackdrop, { NIGHT } from "../../components/MetroBackdrop";
import { getLineColor } from "../../utils/lineColors";

type Status = "idle" | "typing" | "error" | "loading" | "success";

// Same pose meaning as Mascot.tsx: explorer = discovery, thinking = undecided,
// happy = payoff.
const POSE: Record<Status, MascotPose> = {
  idle: "explorer",
  typing: "thinking",
  error: "thinking",
  loading: "thinking",
  success: "happy",
};

// Night Service: the transit map on warm near-black, with one card lit by an
// amber edge so the form is the first thing you see.
const BG = NIGHT;
const ROUTE = "#f5a31a"; // the orange line
const CARD_TOP = "#17110a";
const CARD_BOTTOM = "#0d0905";
const CREAM = "#fff4d6";
const MUTED = "#b9a97e";
const GOLD = "#fbbf24";
const STOPS = ["BOARDING", "WHO'S RIDING", "SECRET CODE", "ALL ABOARD"];

/** The route across the top: the train advances as the card fills in. */
const RouteStrip = memo(function RouteStrip({ step, color }: { step: number; color: string }) {
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(step / 3, {
      duration: 500,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [step, progress]);

  // Translate instead of animating width, so the fill never triggers layout.
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (progress.value - 1) * width }],
  }));
  const trainStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * width }],
  }));

  return (
    <View className="px-1">
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        className="mt-3 h-[3px] rounded-full"
        style={{ backgroundColor: "#4a3d27" }}
      >
        <View className="absolute inset-0 overflow-hidden rounded-full">
          <Animated.View
            style={[{ height: 3, width: "100%", backgroundColor: color }, fillStyle]}
          />
        </View>

        {STOPS.map((_, i) => (
          <View
            key={i}
            className="absolute h-[15px] w-[15px] rounded-full border-[3px]"
            style={{
              left: `${(i / 3) * 100}%`,
              top: -6,
              marginLeft: -7.5,
              borderColor: i <= step ? color : "#6a5835",
              backgroundColor: i <= step ? color : BG,
            }}
          />
        ))}

        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: -9,
              left: -15,
              width: 30,
              height: 20,
              borderRadius: 7,
              borderWidth: 2,
              borderColor: color,
              backgroundColor: "#ffffff",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              shadowColor: color,
              shadowOpacity: 0.9,
              shadowRadius: 8,
              elevation: 6,
            },
            trainStyle,
          ]}
        >
          <View className="h-[5px] w-[5px] rounded-[1px]" style={{ backgroundColor: "#14152b" }} />
          <View className="h-[5px] w-[5px] rounded-[1px]" style={{ backgroundColor: "#14152b" }} />
        </Animated.View>
      </View>

      <View className="mt-4 flex-row justify-between">
        {STOPS.map((label, i) => (
          <Text
            key={label}
            style={[mono, { color: i <= step ? CREAM : "#7d7152" }]}
            className="text-[9px] font-bold tracking-widest"
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
});

export default function LoginScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorText, setErrorText] = useState("");
  const [pressing, setPressing] = useState(false);

  const passwordRef = useRef<TextInputInstance>(null);
  const shakeX = useSharedValue(0);

  // The Gold copy, same carbon-copy tone as the Metro dashboard. There is no
  // sign-up here: the accounts are made ahead of time.
  const line = getLineColor(0);

  const step =
    status === "success"
      ? 3
      : (email.trim() ? 1 : 0) + (password ? 1 : 0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-9, { duration: 50 }),
      withRepeat(withTiming(9, { duration: 90 }), 5, true),
      withTiming(0, { duration: 50 })
    );
  };

  const onFocus = () => {
    if (status === "idle" || status === "error") setStatus("typing");
  };

  const onBlur = () => {
    if (status === "typing" && !email.trim() && !password) setStatus("idle");
  };

  const handleSubmit = async () => {
    if (status === "loading" || status === "success") return;

    if (!email.trim() || !password) {
      setErrorText("CARD NEEDS EMAIL + SECRET CODE");
      setStatus("error");
      shake();
      showErrorToast("Missing info", "Enter email and password.");
      return;
    }

    setStatus("loading");
    const { error } = await signIn(email.trim(), password);

    if (error) {
      setErrorText(error.toUpperCase());
      setStatus("error");
      shake();
      showErrorToast("Auth error", error);
      return;
    }

    setStatus("success");
    showSuccessToast("Welcome", "Logged in!");
  };

  const buttonLabel =
    status === "loading"
      ? "READING CARD…"
      : status === "success"
      ? "ALL ABOARD ✓"
      : status === "error"
      ? "TAP FAILED"
      : "TAP IN";

  // Bright gold with dark text on the dark card, so the button is the loudest
  // thing on screen. Green / red for the result states.
  const buttonBg =
    status === "success" ? "#16a34a" : status === "error" ? "#b3261e" : GOLD;
  const buttonFg = status === "success" || status === "error" ? "#ffffff" : "#1c1208";

  const inputStyle = {
    ...mono,
    color: CREAM,
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingVertical: 6,
    paddingHorizontal: 0,
    fontSize: 14,
    fontWeight: "600" as const,
  };

  const labelStyle = {
    ...mono,
    color: MUTED,
    fontSize: 9,
    fontWeight: "700" as const,
    letterSpacing: 1.5,
  };

  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      <StatusBar style="light" />
      <MetroBackdrop />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 18,
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 70,
          }}
        >
          <RouteStrip step={step} color={ROUTE} />

          <View style={{ marginTop: 26 }}>
            <TrainFlash />
          </View>

          <Animated.View style={[{ marginTop: 18 }, shakeStyle]}>
            <View
              style={{
                borderRadius: 22,
                shadowColor: "#f5a31a",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.28,
                shadowRadius: 22,
                elevation: 12,
              }}
            >
              <LinearGradient
                colors={[CARD_TOP, CARD_BOTTOM]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: "#fbbf2473",
                }}
              />

              {/* TOP: card name, holder photo, fields */}
              <View className="px-[18px] pb-1 pt-4">
                <View className="flex-row justify-between">
                  <View className="flex-1 pr-3">
                    {/* The wordmark above the card already says ORTIBITES */}
                    <Text
                      style={{
                        ...mono,
                        color: line.bg,
                        fontSize: 9,
                        fontWeight: "700",
                        letterSpacing: 1.5,
                        marginTop: 4,
                      }}
                    >
                      {line.label.toUpperCase()}
                    </Text>
                  </View>

                  <View className="items-center">
                    <View
                      className="h-[56px] w-[50px] items-center justify-end overflow-hidden rounded-[7px]"
                      style={{ borderWidth: 2, borderColor: GOLD, backgroundColor: "#fbf3e2" }}
                    >
                      <View style={{ marginBottom: -4 }}>
                        <Mascot pose={POSE[status]} size={54} bob={false} />
                      </View>
                    </View>
                    <Text
                      style={{ ...labelStyle, fontSize: 7, marginTop: 3 }}
                    >
                      HOLDER
                    </Text>
                  </View>
                </View>

                <View className="mt-3">
                  <Text style={labelStyle}>EMAIL</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    returnKeyType="next"
                    placeholder="you@ortigas.ph"
                    placeholderTextColor="#7d7152"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    style={[inputStyle, { marginBottom: 14 }]}
                  />

                  <Text style={labelStyle}>SECRET CODE</Text>
                  <TextInput
                    ref={passwordRef}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onSubmitEditing={handleSubmit}
                    returnKeyType="go"
                    placeholder="••••••••"
                    placeholderTextColor="#7d7152"
                    secureTextEntry
                    style={[inputStyle, { marginBottom: 14 }]}
                  />
                </View>
              </View>

              {/* PERFORATION: dashed tear line with a notch cut out of each edge */}
              <View
                className="border-t-2 border-dashed"
                style={{ borderColor: "#fbbf2466" }}
              >
                <View
                  style={{
                    position: "absolute",
                    left: -11,
                    top: -12,
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: BG,
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    right: -11,
                    top: -12,
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: BG,
                  }}
                />
              </View>

              {/* STUB: the tap-in button */}
              <View className="px-[18px] pb-[18px] pt-4">
                {/* The Pressable only handles touches; the looks live on the plain
                    View inside it. A function style on a NativeWind-wrapped
                    Pressable can lose its background, which left gold text on
                    the gold card. */}
                <Pressable
                  onPress={handleSubmit}
                  onPressIn={() => setPressing(true)}
                  onPressOut={() => setPressing(false)}
                  disabled={status === "loading"}
                >
                  <View
                    style={{
                      height: 58,
                      borderRadius: 14,
                      backgroundColor: buttonBg,
                      borderWidth: 2,
                      borderColor: buttonBg,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                      opacity: pressing ? 0.8 : 1,
                      transform: [{ scale: pressing ? 0.97 : 1 }],
                    }}
                  >
                    <Ionicons
                      name="wifi"
                      size={18}
                      color={buttonFg}
                      style={{ transform: [{ rotate: "90deg" }] }}
                    />
                    <Text
                      style={{
                        color: buttonFg,
                        fontSize: 20,
                        fontWeight: "900",
                        letterSpacing: 2,
                      }}
                    >
                      {buttonLabel}
                    </Text>
                  </View>
                </Pressable>

                {status === "error" && (
                  <View
                    className="mt-3 rounded-md px-2 py-1.5"
                    style={{ backgroundColor: "#b3261e" }}
                  >
                    <Text
                      style={{ ...mono, fontSize: 10, fontWeight: "800", color: "#fff" }}
                      className="text-center"
                    >
                      {errorText}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

    </View>
  );
}
