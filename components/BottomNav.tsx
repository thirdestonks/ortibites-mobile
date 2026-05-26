import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

export default function BottomNav() {
    return (
        <View className="absolute bottom-0 w-full px-4 pb-10">
            <View className="relative flex-row items-center justify-center gap-60 rounded-3xl border border-zinc-800 bg-zinc-950/95 px-10 py-5">
                {/* HOME */}
                <Pressable
                    onPress={() => router.push('/')}
                    className="items-center"
                >
                    <Text className="text-2xl text-zinc-300">
                        ⌂
                    </Text>

                    <Text className="text-zinc-300">
                        Home
                    </Text>
                </Pressable>

                {/* MEMORY */}
                <Pressable
                    onPress={() => router.push('/memories')}
                    className="items-center"
                >
                    <Text className="text-2xl text-amber-400">
                        🕒
                    </Text>

                    <Text className="text-amber-400">
                        Memory
                    </Text>
                </Pressable>

                {/* FLOATING BUTTON */}
                <Pressable
                    onPress={() => router.push('/create')}
                    className="absolute -top-8 h-20 w-20 items-center justify-center rounded-full bg-orange-400"
                    style={{
                        shadowColor: '#fb923c',
                        shadowOffset: {
                            width: 0,
                            height: 10,
                        },
                        shadowOpacity: 0.5,
                        shadowRadius: 20,
                        elevation: 10,
                    }}
                >
                    <Text className="text-5xl text-black">
                        +
                    </Text>
                </Pressable>

            </View>
        </View>
    )
}