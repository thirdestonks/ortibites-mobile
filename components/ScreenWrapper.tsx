import {
    ImageBackground,
    ScrollView,
    View,
} from "react-native";

export default function ScreenWrapper({
    children,
    scroll = false,
}: any) {
    return (
        <ImageBackground
            source={require("../assets/images/bgg.png")}
            resizeMode="cover"
            className="flex-1"
        >
            {/* OVERLAY */}
            <View className="flex-1 bg-black/70">
                {scroll ? (
                    <ScrollView
                        className="flex-1"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                            paddingBottom: 40,
                        }}
                    >
                        <View className="px-5 pt-16">
                            {children}
                        </View>
                    </ScrollView>
                ) : (
                    <View className="flex-1 px-5 pt-16">
                        {children}
                    </View>
                )}
            </View>
        </ImageBackground>
    );
}