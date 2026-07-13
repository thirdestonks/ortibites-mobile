import { Easing } from "react-native-reanimated";

// Cinematic: gentle spring, soft eases.
export const SPRING = { damping: 18, stiffness: 140, mass: 1 } as const;
export const PRESS_SPRING = { damping: 15, stiffness: 220, mass: 0.6 } as const;

export const DURATION = { fast: 200, base: 400, slow: 700 } as const;
export const STAGGER_MS = 70; // per-item delay for list entrance
export const EASE_OUT = Easing.out(Easing.cubic);
