import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "ortibites.roulette.lastSelection";

/** Returns the last spin's selected place ids, or [] if none/corrupt. */
export async function getLastSelection(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is number => typeof x === "number");
  } catch {
    return [];
  }
}

/** Persists the selected place ids. Non-fatal on failure. */
export async function saveLastSelection(ids: number[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Persistence is best-effort; roulette still works without it.
  }
}
