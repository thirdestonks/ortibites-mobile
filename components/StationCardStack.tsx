import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";

import { useHubsStore } from "../stores/hubsStore";
import { showErrorToast } from "./Toast";
import { mono } from "./receipt";
import StationTapCard from "./StationTapCard";

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Station editor as a bottom sheet. It used to render inline in place of the
 * map, which pushed the whole line off screen; as a modal it overlays instead,
 * so the metro screen underneath stays put.
 */
export default function StationCardStack({ visible, onClose }: Props) {
  const hubs = useHubsStore((s) => s.hubs);
  const createHub = useHubsStore((s) => s.createHub);
  const renameHub = useHubsStore((s) => s.renameHub);

  const [newStationName, setNewStationName] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newStationName.trim()) return;
    setAdding(true);
    const { error } = await createHub(newStationName);
    setAdding(false);
    if (error) {
      showErrorToast("Error", error);
      return;
    }
    setNewStationName("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        {/* Tap-outside-to-close scrim */}
        <Animated.View entering={FadeIn.duration(160)} className="absolute inset-0">
          <Pressable onPress={onClose} className="flex-1 bg-black/75" />
        </Animated.View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Animated.View
            entering={SlideInDown.duration(240)}
            className="max-h-[78%] rounded-t-3xl border-t border-zinc-800 bg-zinc-950 px-4 pb-8 pt-3"
          >
            {/* Grab handle */}
            <View className="mb-3 items-center">
              <View className="h-1 w-10 rounded-full bg-zinc-700" />
            </View>

            <View className="mb-3 flex-row items-center justify-between px-1">
              <Text
                style={mono}
                className="text-xs font-bold uppercase tracking-widest text-amber-400"
              >
                Stations
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                className="h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900"
              >
                <Text style={mono} className="text-xs font-bold text-zinc-300">
                  ✕
                </Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View className="gap-2">
                {hubs.map((hub) => (
                  <StationTapCard key={hub.id} hub={hub} onRename={renameHub} />
                ))}
              </View>

              <View className="mt-2 flex-row items-center gap-2 rounded-2xl border border-dashed border-amber-400/40 px-3 py-2">
                <TextInput
                  value={newStationName}
                  onChangeText={setNewStationName}
                  placeholder="+ New station"
                  placeholderTextColor="#71717a"
                  onSubmitEditing={handleAdd}
                  className="flex-1 text-sm text-white"
                />
                <Pressable
                  onPress={handleAdd}
                  disabled={adding}
                  className="items-center justify-center rounded-xl bg-amber-400 px-4 py-2"
                >
                  <Text className="text-base font-black text-black">+</Text>
                </Pressable>
              </View>

              <Text
                style={mono}
                className="mt-2 text-center text-[9px] uppercase tracking-widest text-zinc-600"
              >
                no delete, rename only
              </Text>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
