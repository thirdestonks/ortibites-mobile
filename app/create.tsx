import { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { router } from "expo-router";

import api from "../services/api";

import StarRating from "../components/StarRating";

import {
  showErrorToast,
  showSuccessToast,
} from "../components/Toast";

import ScreenWrapper from "../components/ScreenWrapper";
import ScreenHeader from "../components/ScreenHeader";
import AppButton from "../components/AppButton";

export default function CreatePlaceScreen() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [rating, setRating] = useState(0);
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [favoriteDishes, setFavoriteDishes] = useState<string[]>([]);
  const [prosInput, setProsInput] = useState("");
  const [consInput, setConsInput] = useState("");
  const [favoriteDishInput, setFavoriteDishInput] = useState("");

  const addItem = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    reset: () => void,
    current: string[]
  ) => {
    const trimmed = value.trim();

    if (!trimmed) return;

    setter([...current, trimmed]);
    reset();
  };

  const removeItem = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    current: string[]
  ) => {
    setter(current.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showErrorToast(
        "Missing Name",
        "Please enter a place name."
      );

      return;
    }

    if (rating === 0) {
      showErrorToast(
        "Missing Rating",
        "Please give this place a rating."
      );

      return;
    }
    try {
      await api.post("/restaurants", {
        name,
        address,
        rating: Number(rating),
        pros,
        cons,
        favorite_dishes: favoriteDishes,
      });

      showSuccessToast("Success", "Place created!");

      router.back();
    } catch (error: any) {
      showErrorToast(
        "Error",
        error?.response?.data?.message ||
        error.message ||
        "Unknown error"
      );
    }
  };

  return (
    <ScreenWrapper scroll>
      <ScreenHeader
        title="ADD PLACE"
        subtitle="add another food memory 🍜"
      />

      <View className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
        {/* NAME */}
        <View className="mb-6">
          <Text className="mb-2 text-sm font-bold uppercase tracking-widest text-amber-400">
            Name
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Place name"
            placeholderTextColor="#71717a"
            className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-white"
          />
        </View>

        {/* ADDRESS */}
        <View className="mb-6">
          <Text className="mb-2 text-sm font-bold uppercase tracking-widest text-amber-400">
            Address
          </Text>

          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="SM Clark, Angeles, Pampanga"
            placeholderTextColor="#71717a"
            multiline
            className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-white"
          />
        </View>

        {/* RATING */}
        <View className="mb-8">
          <Text className="mb-3 text-sm font-bold uppercase tracking-widest text-amber-400">
            Rating
          </Text>

          <View className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <StarRating
              value={rating}
              onChange={setRating}
            />
          </View>
        </View>
        {/* PROS */}
        <View className="mb-6">
          <Text className="mb-2 text-sm font-bold uppercase tracking-widest text-green-400">
            Pros
          </Text>

          <View className="flex-row gap-2">
            <TextInput
              value={prosInput}
              onChangeText={setProsInput}
              placeholder="Fast service, good food idk nigga think..."
              placeholderTextColor="#71717a"
              className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-white"
            />

            <Pressable
              onPress={() =>
                addItem(
                  prosInput,
                  setPros,
                  () => setProsInput(""),
                  pros
                )
              }
              className="items-center justify-center rounded-2xl bg-green-500 px-5"
            >
              <Text className="text-lg font-black text-black">
                +
              </Text>
            </Pressable>
          </View>

          <View className="mt-3 gap-2">
            {pros.map((item, index) => (
              <Pressable
                key={index}
                onPress={() =>
                  removeItem(index, setPros, pros)
                }
                className="rounded-2xl border border-green-700 bg-green-950 p-3"
              >
                <Text className="font-semibold text-green-300">
                  ✓ {item}    ✕
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Cons */}
        <View className="mb-6">
          <Text className="mb-2 text-sm font-bold uppercase tracking-widest text-red-400">
            Cons
          </Text>

          <View className="flex-row gap-2">
            <TextInput
              value={consInput}
              onChangeText={setConsInput}
              placeholder="Like Dumbahh staff or badshit food..."
              placeholderTextColor="#71717a"
              className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-white"
            />

            <Pressable
              onPress={() =>
                addItem(
                  consInput,
                  setCons,
                  () => setConsInput(""),
                  cons
                )
              }
              className="items-center justify-center rounded-2xl bg-red-500 px-5"
            >
              <Text className="text-lg font-black text-black">
                +
              </Text>
            </Pressable>
          </View>

          <View className="mt-3 gap-2">
            {cons.map((item, index) => (
              <Pressable
                key={index}
                onPress={() =>
                  removeItem(index, setCons, cons)
                }
                className="rounded-2xl border border-red-700 bg-red-950 p-3"
              >
                <Text className="font-semibold text-red-300">
                  ✕ {item}    ✓
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Favorite Dishes */}
        <View className="mb-6">
          <Text className="mb-2 text-sm font-bold uppercase tracking-widest text-green-400">
            Favorite Dishes
          </Text>

          <View className="flex-row gap-2">
            <TextInput
              value={favoriteDishInput}
              onChangeText={setFavoriteDishInput}
              placeholder="Like Chowfan or Fries..."
              placeholderTextColor="#71717a"
              className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-white"
            />

            <Pressable
              onPress={() =>
                addItem(
                  favoriteDishInput,
                  setFavoriteDishes,
                  () => setFavoriteDishInput(""),
                  favoriteDishes
                )
              }
              className="items-center justify-center rounded-2xl bg-green-500 px-5"
            >
              <Text className="text-lg font-black text-black">
                +
              </Text>
            </Pressable>
          </View>

          <View className="mt-3 gap-2">
            {favoriteDishes.map((item, index) => (
              <Pressable
                key={index}
                onPress={() =>
                  removeItem(index, setFavoriteDishes, favoriteDishes)
                }
                className="rounded-2xl border border-green-700 bg-green-950 p-3"
              >
                <Text className="font-semibold text-green-300">
                  ✓ {item}    ✕
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <AppButton
          title="CREATE PLACE"
          onPress={handleSubmit}
        />
      </View>
    </ScreenWrapper>
  );
}