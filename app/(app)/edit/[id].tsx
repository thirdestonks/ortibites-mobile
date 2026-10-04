import { router, useLocalSearchParams } from "expo-router";

import { useEffect, useState } from "react";

import { Pressable, Text, TextInput, View } from "react-native";

import { usePlacesStore } from "../../../stores/placesStore";

import { showErrorToast, showSuccessToast } from "../../../components/Toast";

import ScreenWrapper from "../../../components/ScreenWrapper";
import AppButton from "../../../components/AppButton";
import LocationPicker from "../../../components/LocationPicker";
import StarRating from "../../../components/StarRating";
import PageLoader from "../../../components/PageLoader";
import HubPicker from "../../../components/HubPicker";
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
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [favoriteDishes, setFavoriteDishes] = useState<string[]>([]);
  const [prosInput, setProsInput] = useState("");
  const [consInput, setConsInput] = useState("");
  const [favoriteDishInput, setFavoriteDishInput] = useState("");
  const [hubId, setHubId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlace();
  }, []);

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

  const loadPlace = async () => {
    const place = await fetchPlace(id as string);

    if (place) {
      setName(place.name ?? "");
      setAddress(place.address ?? "");
      setLatitude(place.latitude ?? null);
      setLongitude(place.longitude ?? null);
      setRating(Number(place.rating) || 0);

      setPros(place.pros ?? []);
      setCons(place.cons ?? []);
      setFavoriteDishes(place.favorite_dishes ?? []);
      setHubId(place.hub_id ?? null);
    }

    setLoading(false);
  };

  const handleUpdate = async () => {
    const { error } = await updatePlace(id as string, {
      name,
      address,
      rating,
      pros,
      cons,
      favorite_dishes: favoriteDishes,
      hub_id: hubId,
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

        {/* STATION */}
        <HubPicker value={hubId} onChange={setHubId} />

        <DashDivider />

        {/* PROS */}
        <Text style={mono} className="mb-2 text-xs font-bold uppercase text-green-400">
          Pros
        </Text>
        <View className="flex-row gap-2">
          <TextInput
            value={prosInput}
            onChangeText={setProsInput}
            placeholder="Fast service, cozy, cheap..."
            placeholderTextColor="#71717a"
            className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-white"
          />
          <Pressable
            onPress={() =>
              addItem(prosInput, setPros, () => setProsInput(""), pros)
            }
            className="items-center justify-center rounded-2xl bg-green-500 px-5"
          >
            <Text className="text-lg font-black text-black">+</Text>
          </Pressable>
        </View>
        <View className="mt-3 gap-2">
          {pros.map((item, index) => (
            <Pressable
              key={index}
              onPress={() => removeItem(index, setPros, pros)}
              className="rounded-2xl border border-green-700 bg-green-950 p-3"
            >
              <Text className="font-semibold text-green-300">✓ {item}    ✕</Text>
            </Pressable>
          ))}
        </View>

        <DashDivider />

        {/* CONS */}
        <Text style={mono} className="mb-2 text-xs font-bold uppercase text-red-400">
          Cons
        </Text>
        <View className="flex-row gap-2">
          <TextInput
            value={consInput}
            onChangeText={setConsInput}
            placeholder="Slow service, cramped, pricey..."
            placeholderTextColor="#71717a"
            className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-white"
          />
          <Pressable
            onPress={() =>
              addItem(consInput, setCons, () => setConsInput(""), cons)
            }
            className="items-center justify-center rounded-2xl bg-red-500 px-5"
          >
            <Text className="text-lg font-black text-black">+</Text>
          </Pressable>
        </View>
        <View className="mt-3 gap-2">
          {cons.map((item, index) => (
            <Pressable
              key={index}
              onPress={() => removeItem(index, setCons, cons)}
              className="rounded-2xl border border-red-700 bg-red-950 p-3"
            >
              <Text className="font-semibold text-red-300">✕ {item}    ✓</Text>
            </Pressable>
          ))}
        </View>

        <DashDivider />

        {/* FAVORITE DISHES */}
        <Text style={mono} className="mb-2 text-xs font-bold uppercase text-green-400">
          Favorite Dishes
        </Text>
        <View className="flex-row gap-2">
          <TextInput
            value={favoriteDishInput}
            onChangeText={setFavoriteDishInput}
            placeholder="Chowfan, fries..."
            placeholderTextColor="#71717a"
            className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-white"
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
            <Text className="text-lg font-black text-black">+</Text>
          </Pressable>
        </View>
        <View className="mt-3 gap-2">
          {favoriteDishes.map((item, index) => (
            <Pressable
              key={index}
              onPress={() => removeItem(index, setFavoriteDishes, favoriteDishes)}
              className="rounded-2xl border border-green-700 bg-green-950 p-3"
            >
              <Text className="font-semibold text-green-300">🍜 {item}    ✕</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ReceiptEdge dir="bottom" />

      <View className="mt-5">
        <AppButton title="UPDATE PLACE" onPress={handleUpdate} />
      </View>
    </ScreenWrapper>
  );
}
