import type { Place } from "../types/place";

export interface WrappedStats {
  totalSpots: number;
  earliestDate: string | null; // ISO of earliest created_at, or null
  topDish: string | null; // most frequent favorite dish, or null
  topDishCount: number;
  highestRated: { name: string; rating: number } | null;
  averageRating: number | null; // mean of non-null ratings, or null
  ratedCount: number;
}

/** Computes recap stats from the user's saved places. Pure — no I/O. */
export function computeWrappedStats(places: Place[]): WrappedStats {
  const totalSpots = places.length;

  // Earliest created_at (ISO strings compare lexicographically).
  let earliestDate: string | null = null;
  for (const p of places) {
    if (p.created_at && (!earliestDate || p.created_at < earliestDate)) {
      earliestDate = p.created_at;
    }
  }

  // Most frequent favorite dish across all places.
  const dishCounts = new Map<string, number>();
  for (const p of places) {
    for (const dish of p.favorite_dishes ?? []) {
      const key = dish.trim();
      if (!key) continue;
      dishCounts.set(key, (dishCounts.get(key) ?? 0) + 1);
    }
  }
  let topDish: string | null = null;
  let topDishCount = 0;
  for (const [dish, count] of dishCounts) {
    if (count > topDishCount) {
      topDish = dish;
      topDishCount = count;
    }
  }

  // Places that actually have a rating.
  const rated = places.filter(
    (p): p is Place & { rating: number } => typeof p.rating === "number"
  );
  const ratedCount = rated.length;

  // Highest rated; ties broken by most recent created_at.
  let highestRated: { name: string; rating: number } | null = null;
  let bestRating = -Infinity;
  let bestDate = "";
  for (const p of rated) {
    const d = p.created_at ?? "";
    if (p.rating > bestRating || (p.rating === bestRating && d > bestDate)) {
      bestRating = p.rating;
      bestDate = d;
      highestRated = { name: p.name, rating: p.rating };
    }
  }

  const averageRating =
    ratedCount === 0
      ? null
      : rated.reduce((sum, p) => sum + p.rating, 0) / ratedCount;

  return {
    totalSpots,
    earliestDate,
    topDish,
    topDishCount,
    highestRated,
    averageRating,
    ratedCount,
  };
}

/** Formats an ISO date as e.g. "July 2026", or null if missing/invalid. */
export function formatMonthYear(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
