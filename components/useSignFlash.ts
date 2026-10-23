import { useEffect, useMemo } from "react";
import {
  makeMutable,
  useDerivedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

export const SIGN_WORD = "ORTIBITES";

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Drives the station sign's letters. Every `period` ms the letters light up one
 * after another (right to left, the way the train travels), stay lit for a
 * moment, then flicker out in a random order, each on its own timing.
 *
 * Only the kick-off happens on the JS thread (a few assignments every few
 * seconds); the actual fades run on the UI thread.
 */
export function useSignFlash({ firstDelay, period }: { firstDelay: number; period: number }) {
  const letters = useMemo(() => Array.from(SIGN_WORD).map(() => makeMutable(0)), []);

  // How lit the whole plate is: the average of its letters.
  const ring = useDerivedValue(() => {
    let sum = 0;
    for (let i = 0; i < letters.length; i++) sum += letters[i].value;
    return sum / letters.length;
  });

  useEffect(() => {
    const fire = () => {
      letters.forEach((letter, i) => {
        const fromRight = letters.length - 1 - i;
        const start = fromRight * 85 + rand(0, 90); // ignite right to left
        const hold = rand(900, 2100); // stays lit about 1 to 2 seconds

        // A few stutters before it goes out for good.
        const seq: ReturnType<typeof withTiming>[] = [];
        const blinks = 2 + Math.floor(Math.random() * 3);
        for (let k = 0; k < blinks; k++) {
          seq.push(withTiming(0, { duration: rand(30, 95) }));
          seq.push(withTiming(1, { duration: rand(55, 130) }));
        }
        seq.push(withTiming(0, { duration: rand(140, 280) }));

        // The helpers are typed loosely; each of these is just a number animation.
        letter.value = withDelay(
          start,
          withSequence(
            withTiming(1, { duration: 230 }),
            withDelay(hold, withSequence(seq[0], ...seq.slice(1)))
          )
        ) as number;
      });
    };

    let interval: ReturnType<typeof setInterval> | undefined;
    const first = setTimeout(() => {
      fire();
      interval = setInterval(fire, period);
    }, firstDelay);

    return () => {
      clearTimeout(first);
      if (interval) clearInterval(interval);
    };
  }, [letters, firstDelay, period]);

  return { letters: letters as SharedValue<number>[], ring };
}
