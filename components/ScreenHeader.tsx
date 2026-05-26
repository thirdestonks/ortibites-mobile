import {
    Text,
    View,
} from "react-native";

export default function ScreenHeader({
    title,
    subtitle,
}: any) {
    return (
        <View className="mb-8">
            <Text className="text-5xl font-black tracking-widest text-white">
                {title}
            </Text>

            <Text className="mt-1 text-zinc-300">
                {subtitle}
            </Text>
        </View>
    );
}