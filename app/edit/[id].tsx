import {
    router,
    useLocalSearchParams,
} from "expo-router";

import {
    useEffect,
    useState,
} from "react";

import {
    Text,
    TextInput,
    View,
} from "react-native";

import api from "../../services/api";

import {
    showSuccessToast,
} from "../../components/Toast";

import ScreenWrapper from "../../components/ScreenWrapper";
import ScreenHeader from "../../components/ScreenHeader";
import AppButton from "../../components/AppButton";
import StarRating from "../../components/StarRating";
import PageLoader from "../../components/PageLoader";

export default function EditPlaceScreen() {
    const { id } = useLocalSearchParams();

    const [name, setName] = useState("");
    const [rating, setRating] = useState(0);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlace();
    }, []);

    const fetchPlace = async () => {
        try {
            const response = await api.get(`/restaurants/${id}`);

            const place = response.data.data;

            setName(place.name);

            setRating(Number(place.rating));
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        try {
            await api.put(`/restaurants/${id}`, {
                name,
                rating,
            });

            showSuccessToast(
                "Success",
                "Place updated!"
            );

            router.back();
        } catch (error) {
            console.log(error);
        }
    };

    if (loading) {
        return <PageLoader />;
    }

    return (
        <ScreenWrapper scroll>
            <ScreenHeader
                title="EDIT PLACE"
                subtitle="update your food memory 🍜"
            />

            {/* FORM CARD */}
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

                <AppButton
                    title="UPDATE PLACE"
                    onPress={handleUpdate}
                />
            </View>
        </ScreenWrapper>
    );
}