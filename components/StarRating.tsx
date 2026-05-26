import { Pressable, Text, View } from "react-native";

interface StarRatingProps {
    value: number;
    onChange: (rating: number) => void;
}

export default function StarRating({
    value,
    onChange,
}: StarRatingProps) {
    return (
        <View className="flex-row gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                    key={star}
                    onPress={() => onChange(star)}
                >
                    <Text className="text-4xl">
                        {star <= value ? "⭐" : "☆"}
                    </Text>
                </Pressable>
            ))}
        </View>
    );
}