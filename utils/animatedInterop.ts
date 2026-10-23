import { createElement, forwardRef } from "react";
import { cssInterop } from "nativewind";
import Animated from "react-native-reanimated";

/**
 * Makes `className` work on Reanimated components without breaking their
 * animated styles.
 *
 * Reanimated 4.7 renders animated wrappers itself, so NativeWind no longer
 * reaches the `className` on them. Registering them with `{ className: "style" }`
 * brings className back but makes NativeWind rebuild the whole `style` prop,
 * which throws away Reanimated's animated style objects (the FAB lost its
 * background, the card stamp stopped being absolute, `[static, animated]`
 * arrays lost the static half).
 *
 * So the class styles go to a separate `classStyle` prop and are merged into
 * `style` here, leaving `style` itself untouched.
 */
function bridge<T extends object>(Wrapped: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Bridged: any = forwardRef<unknown, any>(function Bridged(
    { classStyle, style, ...rest },
    ref
  ) {
    const merged =
      classStyle == null ? style : style == null ? classStyle : [classStyle, style];
    return createElement(Wrapped as never, { ...rest, style: merged, ref });
  });
  Bridged.displayName = "ClassNameBridge";
  cssInterop(Bridged, { className: "classStyle" });
  return Bridged;
}

/**
 * Drop-in for `import Animated from "react-native-reanimated"` wherever a file
 * puts `className` on Animated.View / Text / Image. Named imports (FadeIn,
 * useSharedValue, ...) still come from react-native-reanimated itself.
 *
 * It is a copy rather than a patch: the real default export is a read-only
 * module namespace.
 */
const PatchedAnimated = {
  ...Animated,
  View: bridge(Animated.View),
  Text: bridge(Animated.Text),
  Image: bridge(Animated.Image),
} as typeof Animated;

export default PatchedAnimated;

/**
 * For one-off animated components made with `Animated.createAnimatedComponent`
 * (AnimatedPressable, AnimatedGradient, ...): returns a version where
 * `className` works.
 */
export function withClassName<T extends object>(Component: T): T {
  return bridge(Component);
}
