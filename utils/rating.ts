export type RatingMeta = {
  label: string; // e.g. "🔥 This Fire"
  color: string; // Tailwind text color, e.g. "text-green-400"
  accent: string; // Tailwind bg for bars, e.g. "bg-green-400"
  tint: string; // Tailwind bg tint for chips, e.g. "bg-green-500/15"
};

export function getRatingMeta(rating: number): RatingMeta {
  if (rating >= 4.5) {
    return {
      label: "🔥 This Fire",
      color: "text-green-400",
      accent: "bg-green-400",
      tint: "bg-green-500/15",
    };
  }

  if (rating >= 3) {
    return {
      label: "👍 oks na bai",
      color: "text-yellow-400",
      accent: "bg-yellow-400",
      tint: "bg-yellow-500/15",
    };
  }

  return {
    label: "😬 kadiri boi",
    color: "text-red-400",
    accent: "bg-red-400",
    tint: "bg-red-500/15",
  };
}
