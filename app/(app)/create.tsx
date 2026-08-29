import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { router } from "expo-router";

import { usePlacesStore } from "../../stores/placesStore";
import { getRatingMeta } from "../../utils/rating";
import { CON_PRESETS, DISH_PRESETS, PRO_PRESETS } from "../../utils/quickTags";

import StarRating from "../../components/StarRating";

import { showErrorToast, showSuccessToast } from "../../components/Toast";

import ScreenWrapper from "../../components/ScreenWrapper";
import LocationPicker from "../../components/LocationPicker";
import HubPicker from "../../components/HubPicker";
import TagPicker from "../../components/TagPicker";
import { mono } from "../../components/receipt";

const STEPS = ["Where", "Verdict", "Dishes"] as const;

/** Three nodes on a track, so the form reads like the rest of the app. */
function StepRail({ step }: { step: number }) {
  return (
    <View className="mt-4">
      <View className="h-[3px] flex-row rounded-full bg-zinc-800">
        <View
          className="rounded-full bg-amber-400"
          style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
        />
      </View>
      <View className="-mt-[8px] flex-row justify-between">
        {STEPS.map((label, i) => (
          <View key={label} className="items-center" style={{ width: 70 }}>
            <View
              className={`h-3.5 w-3.5 rounded-full border-[3px] border-zinc-950 ${
                i <= step ? "bg-amber-400" : "bg-zinc-700"
              }`}
            />
            <Text
              style={mono}
              className={`mt-1.5 text-[8px] uppercase tracking-widest ${
                i <= step ? "text-amber-400" : "text-zinc-600"
              }`}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function CreatePlaceScreen() {
  const createPlace = usePlacesStore((s) => s.createPlace);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [favoriteDishes, setFavoriteDishes] = useState<string[]>([]);
  const [hubId, setHubId] = useState<number | null>(null);

  const canLeaveStepOne = name.trim().length > 0;

  const handleSubmit = async () => {
    if (!name.trim()) {
      showErrorToast("Missing Name", "Please enter a place name.");
      setStep(0);
      return;
    }

    setSaving(true);
    const { error } = await createPlace({
      name: name.trim(),
      address,
      // Rating is optional now: steps 2 and 3 can be skipped entirely.
      rating: rating > 0 ? Number(rating) : undefined,
      pros,
      cons,
      favorite_dishes: favoriteDishes,
      hub_id: hubId,
      latitude,
      longitude,
    });
    setSaving(false);

    if (error) {
      showErrorToast("Error", error);
      return;
    }

    showSuccessToast("Success", "Place created!");

    router.back();
  };

  const next = () => {
    if (step === 0 && !canLeaveStepOne) {
      showErrorToast("Missing Name", "Please enter a place name.");
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleSubmit();
  };

  const back = () => {
    if (step === 0) router.back();
    else setStep(step - 1);
  };

  return (
    <ScreenWrapper scroll>
      {/* HEADER */}
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={back}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full border border-zinc-700"
        >
          <Text className="text-base text-zinc-400">{step === 0 ? "✕" : "‹"}</Text>
        </Pressable>
        <View className="flex-1">
          <Text className="text-2xl font-extrabold uppercase tracking-widest text-zinc-100">
            {step === 0 ? "New spot" : name.trim().toUpperCase() || "NEW SPOT"}
          </Text>
          <Text
            style={mono}
            className="mt-0.5 text-[9px] uppercase tracking-[.2em] text-amber-400/80"
          >
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </Text>
        </View>
      </View>

      <StepRail step={step} />

      {/* ── STEP 1 · WHERE ── */}
      {step === 0 && (
        <Animated.View entering={FadeIn.duration(180)} className="mt-8 gap-7">
          <View>
            <Text style={mono} className="mb-2 text-xs font-bold uppercase text-amber-400">
              What's it called
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Place name"
              placeholderTextColor="#71717a"
              autoFocus
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-white"
            />
          </View>

          <View>
            <HubPicker value={hubId} onChange={setHubId} />
          </View>

          <View>
            <Text style={mono} className="mb-2 text-xs font-bold uppercase text-amber-400">
              Where exactly
            </Text>
            <LocationPicker
              address={address}
              latitude={latitude}
              longitude={longitude}
              onAddressChange={setAddress}
              onCoordsChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
            />
            <Text
              style={mono}
              className="mt-2 text-[9px] uppercase tracking-wider text-zinc-600"
            >
              Optional · powers the Maps button later
            </Text>
          </View>
        </Animated.View>
      )}

      {/* ── STEP 2 · VERDICT ── */}
      {step === 1 && (
        <Animated.View entering={FadeIn.duration(180)} className="mt-8 gap-7">
          <View>
            <Text style={mono} className="mb-3 text-xs font-bold uppercase text-amber-400">
              Rate it
            </Text>
            <View className="items-center rounded-2xl border border-zinc-800 bg-zinc-950 py-5">
              <StarRating value={rating} onChange={setRating} />
              <Text
                style={mono}
                className={`mt-3 text-xs font-bold uppercase tracking-widest ${
                  rating > 0 ? getRatingMeta(rating).color : "text-zinc-600"
                }`}
              >
                {rating > 0 ? `[ ${getRatingMeta(rating).label} ]` : "tap to rate"}
              </Text>
            </View>
          </View>

          <TagPicker
            label="What's good"
            tone="pro"
            presets={PRO_PRESETS}
            value={pros}
            onChange={setPros}
          />

          <TagPicker
            label="What's not"
            tone="con"
            presets={CON_PRESETS}
            value={cons}
            onChange={setCons}
          />
        </Animated.View>
      )}

      {/* ── STEP 3 · DISHES ── */}
      {step === 2 && (
        <Animated.View entering={FadeIn.duration(180)} className="mt-8 gap-7">
          <TagPicker
            label="Favorite dishes"
            tone="dish"
            presets={DISH_PRESETS}
            value={favoriteDishes}
            onChange={setFavoriteDishes}
            placeholder="Chowfan, fries…"
          />

          {/* Last look before it goes on the line */}
          <View className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <Text
              style={mono}
              className="text-[9px] uppercase tracking-[.2em] text-zinc-500"
            >
              Saving
            </Text>
            <Text style={mono} className="mt-1.5 text-base font-bold text-amber-100">
              {name.trim().toUpperCase() || "—"}
            </Text>
            <Text style={mono} className="mt-1 text-[11px] text-zinc-500">
              {rating > 0 ? `${rating}/5` : "unrated"} · {pros.length} pros ·{" "}
              {cons.length} cons · {favoriteDishes.length} dishes
            </Text>
          </View>
        </Animated.View>
      )}

      {/* ── NAV ── */}
      <View className="mt-9 flex-row gap-2">
        <Pressable
          onPress={next}
          disabled={saving}
          className="h-12 flex-1 items-center justify-center rounded-xl bg-amber-400"
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          <Text style={mono} className="text-sm font-bold uppercase tracking-widest text-black">
            {saving
              ? "Saving…"
              : step === STEPS.length - 1
              ? "Save spot"
              : `Next · ${STEPS[step + 1]}`}
          </Text>
        </Pressable>

        {/* Only the name is required, so everything after step 1 can be skipped */}
        {step > 0 && step < STEPS.length - 1 && (
          <Pressable
            onPress={handleSubmit}
            disabled={saving}
            className="h-12 items-center justify-center rounded-xl border border-zinc-700 px-4"
          >
            <Text style={mono} className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Save now
            </Text>
          </Pressable>
        )}
      </View>
    </ScreenWrapper>
  );
}
