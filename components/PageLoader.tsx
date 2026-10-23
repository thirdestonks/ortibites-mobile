import { View } from "react-native";

import TrainLoader from "./TrainLoader";

/** Full-screen loader for screens that must wait on a fetch (dark app theme). */
export default function PageLoader() {
  return (
    <View className="flex-1 items-center justify-center bg-zinc-950">
      <TrainLoader variant="dark" label="LOADING BITES" />
    </View>
  );
}
