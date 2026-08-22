import type { ReactNode } from "react";
import { ImageBackground, type ImageSourcePropType, Text, View } from "react-native";

import { mono } from "./receipt";

/**
 * Wrapped's stat card: generated artwork as the background, live text laid
 * over the quiet centre the art reserves.
 *
 * The art is produced from a reference image, so its palette changes with
 * whatever style is generated. What stays fixed is the contract the art must
 * honour: 16:9, a dark low-detail centre, and detail pushed to the edges.
 * Text sits inside SAFE_X / SAFE_Y, which mirror that contract.
 */

/** Native size of the art, 1209x675. */
export const CARD_RATIO = 1209 / 675;

/**
 * Dims the art so any generated card sits in the app's key regardless of how
 * bright it arrives. Applied to the image rather than as an overlay View:
 * the art's silhouette is carried by its alpha channel, and an overlay would
 * paint over the transparent corners and square the card off.
 */
const ART_OPACITY = 0.82;

/**
 * Legibility floor behind the text. Barely visible on dark art, but keeps the
 * stat readable if a bright card is dropped in. Set to "transparent" to remove.
 */
const TEXT_SCRIM = "rgba(0,0,0,0.28)";

/** One slot per Wrapped card. `highlights` carries Top Spot and Top Dish. */
export type CardSlot = "spots" | "highlights" | "rating";

/**
 * Pool of interchangeable card art. Each Wrapped visit draws three distinct
 * pieces from here, so the deck doesn't look identical every time.
 */
const CARD_ART_POOL: ImageSourcePropType[] = [
  require("../assets/images/card_diner.png"),
  require("../assets/images/pussy.png"),
  require("../assets/images/japanight.png"),
  require("../assets/images/retroOne.png"),
  require("../assets/images/retroTwo.png"),
  require("../assets/images/underwaterOne.png"),
  require("../assets/images/terminalOne.png"),
  require("../assets/images/snorlaxOne.png"),
  require("../assets/images/carOne.png"),
  require("../assets/images/foodOne.png"),
  require("../assets/images/umaruOne.png"),
];

/**
 * Draws one piece of art per slot, without repeats, so the three cards on
 * screen together never share the same background. Call once per Wrapped
 * mount (e.g. via useMemo) rather than per card, or slots could collide.
 */
export function pickCardArt(
  slots: CardSlot[]
): Record<CardSlot, ImageSourcePropType> {
  const shuffled = [...CARD_ART_POOL].sort(() => Math.random() - 0.5);
  return Object.fromEntries(
    slots.map((slot, i) => [slot, shuffled[i % shuffled.length]])
  ) as Record<CardSlot, ImageSourcePropType>;
}

/** Cards sit slightly off-square, so the stack reads as stamped rather than filed. */
export const CARD_TILT: Record<CardSlot, number> = {
  spots: -2.2,
  highlights: 1.6,
  rating: -1.1,
};

/**
 * Cards size from the height their row is given, deriving width from the
 * aspect ratio, so three of them always share the screen without scrolling.
 * The cap leaves room for the tilt to swing without clipping at the edges.
 */
const CARD_MAX_WIDTH = "96%";

/** Inset matching the art's reserved centre: 70% of width, 55% of height. */
const SAFE_X = "16%";
const SAFE_Y = "23%";

/** Art centres are dark, so text is light and carries a shadow for speckle. */
const TEXT_SHADOW = {
  textShadowColor: "rgba(0,0,0,0.9)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
} as const;

export function CardLabel({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        ...mono,
        ...TEXT_SHADOW,
        letterSpacing: 1.5,
        color: "rgba(255,255,255,0.65)",
      }}
      numberOfLines={1}
      className="text-center text-[10px] font-bold"
    >
      {children}
    </Text>
  );
}

export function CardValue({
  children,
  tone = "plain",
  size = "lg",
}: {
  children: ReactNode;
  tone?: "plain" | "accent";
  /** "sm" for the paired card, which fits two stats in one safe zone. */
  size?: "lg" | "sm";
}) {
  return (
    <Text
      style={{
        ...TEXT_SHADOW,
        color: tone === "accent" ? "#fbbf24" : "#ffffff",
      }}
      numberOfLines={2}
      adjustsFontSizeToFit
      className={`mt-1 text-center font-black ${
        size === "lg" ? "text-2xl" : "text-base"
      }`}
    >
      {children}
    </Text>
  );
}

/** Hairline rule separating the two halves of the paired card. */
export function CardDivider() {
  return (
    <View
      style={{ width: 1, backgroundColor: "rgba(255,255,255,0.18)" }}
      className="h-3/4"
    />
  );
}

export function CardCaption({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{ ...mono, ...TEXT_SHADOW, color: "rgba(255,255,255,0.55)" }}
      numberOfLines={1}
      className="mt-1 text-center text-[10px]"
    >
      {children}
    </Text>
  );
}

/**
 * One card, backed by whichever artwork its slot is assigned and tilted a
 * couple of degrees so the stack reads as stamped.
 *
 * Deliberately carries no shadow or elevation: those render against the view's
 * rectangle, which would draw a hard square edge around art whose corners are
 * transparent, undoing the silhouette.
 */
export function WrappedCard({
  slot,
  art,
  children,
}: {
  slot: CardSlot;
  art: ImageSourcePropType;
  children: ReactNode;
}) {
  return (
    <ImageBackground
      source={art}
      resizeMode="contain"
      style={{
        height: "100%",
        maxWidth: CARD_MAX_WIDTH,
        aspectRatio: CARD_RATIO,
        alignSelf: "center",
        transform: [{ rotate: `${CARD_TILT[slot]}deg` }],
      }}
      imageStyle={{ opacity: ART_OPACITY }}
    >
      <View
        style={{ paddingHorizontal: SAFE_X, paddingVertical: SAFE_Y }}
        className="flex-1"
      >
        <View
          style={{ backgroundColor: TEXT_SCRIM }}
          className="flex-1 items-center justify-center rounded-2xl px-2"
        >
          {children}
        </View>
      </View>
    </ImageBackground>
  );
}
