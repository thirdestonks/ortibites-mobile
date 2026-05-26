import {
  Pressable,
  Text,
} from "react-native";

export default function AppButton({
  title,
  onPress,
}: any) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-5 rounded-xl bg-white"
      style={({ pressed }) => ({
        transform: [
          {
            scale: pressed ? 0.97 : 1,
          },
        ],

        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text className="p-4 text-center text-lg font-black text-black">
        {title}
      </Text>
    </Pressable>
  );
}