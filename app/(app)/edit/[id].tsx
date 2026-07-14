import { router, useLocalSearchParams } from "expo-router";

import { useEffect, useState } from "react";

import { Text, TextInput, View } from "react-native";

import { usePlacesStore } from "../../../stores/placesStore";

import { showErrorToast, showSuccessToast } from "../../../components/Toast";

import ScreenWrapper from "../../../components/ScreenWrapper";
import AppButton from "../../../components/AppButton";
import LocationPicker from "../../../components/LocationPicker";
import StarRating from "../../../components/StarRating";
import PageLoader from "../../../components/PageLoader";
import {
  mono,
  ReceiptEdge,
  ReceiptHeader,
  DashDivider,
} from "../../../components/receipt";

export default function EditPlaceScreen() {
  const { id } = useLocalSearchParams();

  const fetchPlace = usePlacesStore((s) => s.fetchPlace);
  const updatePlace = usePlacesStore((s) => s.updatePlace);

  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [favoriteDishes, setFavoriteDishes] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlace();
  }, []);

  const loadPlace = async () => {
    const place = await fetchPlace(id as string);

    if (place) {
      setName(place.name ?? "");
      setAddress(place.address ?? "");
      setLatitude(place.latitude ?? null);
      setLongitude(place.longitude ?? null);
      setRating(Number(place.rating) || 0);

      setPros(place.pros?.join(", ") ?? "");
      setCons(place.cons?.join(", ") ?? "");
      setFavoriteDishes(place.favorite_dishes?.join(", ") ?? "");
    }

    setLoading(false);
  };

  const handleUpdate = async () => {
    const { error } = await updatePlace(id as string, {
      name,
      address,
      rating,
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
      latitude,
      longitude,
    });

    if (error) {
      showErrorToast("Error", error);
      return;
    }

    showSuccessToast("Success", "Place updated!");

    router.back();
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <ScreenWrapper scroll>
      <ReceiptEdge dir="top" />

      <View className="bg-zinc-900 px-5 pb-6 pt-3">
        <ReceiptHeader caption="EDIT ORDER" />
        <Text style={mono} className="mt-2 text-center text-xs text-zinc-500">
          update your food memory 🍜
        </Text>

        <DashDivider />

        {/* NAME */}
        <Text style={mono} className="mb-2 text-xs font-bold uppercase text-amber-400">
          Name
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Place name"
          placeholderTextColor="#71717a"
          className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-white"
        />

        <DashDivider />

        {/* ADDRESS */}
        <Text style={mono} className="mb-2 text-xs font-bold uppercase text-amber-400">
          Address
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

        <DashDivider />

        {/* RATING */}
        <Text style={mono} className="mb-3 text-xs font-bold uppercase text-amber-400">
          Rating
        </Text>
        <View className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <StarRating value={rating} onChange={setRating} />
        </View>

        <DashDivider />

        {/* PROS */}
        <Text style={mono} className="mb-2 text-xs font-bold uppercase text-green-400">
          Pros
        </Text>
        <Text style={mono} className="mb-2 text-[10px] text-zinc-500">
          comma-separated
        </Text>
        <TextInput
          value={pros}
          onChangeText={setPros}
          placeholder="Good food, Cozy, Cheap"
          placeholderTextColor="#71717a"
          multiline
          className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-white"
        />

        <DashDivider />

        {/* CONS */}
        <Text style={mono} className="mb-2 text-xs font-bold uppercase text-red-400">
          Cons
        </Text>
        <Text style={mono} className="mb-2 text-[10px] text-zinc-500">
          comma-separated
        </Text>
        <TextInput
          value={cons}
          onChangeText={setCons}
          placeholder="Crowded, Slow service"
          placeholderTextColor="#71717a"
          multiline
          className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-white"
        />

        <DashDivider />

        {/* FAVORITE DISHES */}
        <Text style={mono} className="mb-2 text-xs font-bold uppercase text-green-400">
          Favorite Dishes
        </Text>
        <Text style={mono} className="mb-2 text-[10px] text-zinc-500">
          comma-separated
        </Text>
        <TextInput
          value={favoriteDishes}
          onChangeText={setFavoriteDishes}
          placeholder="Beef Curry, Chowfan"
          placeholderTextColor="#71717a"
          multiline
          className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-white"
        />
      </View>

      <ReceiptEdge dir="bottom" />

      <View className="mt-5">
        <AppButton title="UPDATE PLACE" onPress={handleUpdate} />
      </View>
    </ScreenWrapper>
  );
}
