import { useState } from "react";
import {
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
  const [rating, setRating] = useState(0);
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [favoriteDishes, setFavoriteDishes] = useState("");

  const handleSubmit = async () => {
    try {
      await api.post("/restaurants", {
        name,
        rating: Number(rating),

        pros: pros
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        cons: cons
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        favorite_dishes: favoriteDishes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });

      showSuccessToast("Success", "Place created!");

      router.back();
    } catch (error) {
      console.log(error);

      showErrorToast("Error", "Something went wrong.");
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
          <Text className="mb-2 text-sm font-bold uppercase tracking-widest text-amber-400">
            Pros
          </Text>

          <TextInput
            value={pros}
            onChangeText={setPros}
            placeholder="Good food, Cozy, Cheap"
            placeholderTextColor="#71717a"
            multiline
            className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-white"
          />
        </View>

        {/* CONS */}
        <View className="mb-6">
          <Text className="mb-2 text-sm font-bold uppercase tracking-widest text-amber-400">
            Cons
          </Text>

          <TextInput
            value={cons}
            onChangeText={setCons}
            placeholder="Crowded, Slow service"
            placeholderTextColor="#71717a"
            multiline
            className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-white"
          />
        </View>

        {/* FAVORITE DISHES */}
        <View className="mb-8">
          <Text className="mb-2 text-sm font-bold uppercase tracking-widest text-amber-400">
            Favorite Dishes
          </Text>

          <TextInput
            value={favoriteDishes}
            onChangeText={setFavoriteDishes}
            placeholder="Beef Curry, Chowfan"
            placeholderTextColor="#71717a"
            multiline
            className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-white"
          />
        </View>

        <AppButton
          title="CREATE PLACE"
          onPress={handleSubmit}
        />
      </View>
    </ScreenWrapper>
  );
}