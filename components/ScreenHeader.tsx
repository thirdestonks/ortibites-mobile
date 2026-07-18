import {
    Pressable,
    Text,
    View,
} from "react-native";

import { useGuardedPush } from "../utils/navigation";

export default function ScreenHeader({
    title,
    subtitle,
    right,
}: any) {
    const push = useGuardedPush();

    return (
        <View className="mb-8 flex-row items-start justify-between">
            <View className="flex-1">
                <Pressable onPress={() => push("/")}>
                    <Text className="text-5xl font-black tracking-widest text-white">
                        {title}
                    </Text>
                </Pressable>

                <Text className="mt-1 text-zinc-300">
                    {subtitle}
                </Text>
            </View>

            {right ? <View className="ml-3 mt-2">{right}</View> : null}
        </View>
    );
}