@AGENTS.md

# OrtiBites Mobile

A retro-diner-inspired food memory app for Ortigas workers to discover, rate, and revisit their favorite food spots. It's a personal food journal — not a generic restaurant directory.

## Golden rule

Expo SDK 54 APIs have changed. Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any Expo code. Do not rely on memory of older SDK APIs.

## Commands

```bash
pnpm start        # expo start (dev server)
pnpm android      # expo start --android
pnpm ios          # expo start --ios
pnpm web          # expo start --web
```

Package manager is **pnpm** (see pnpm-lock.yaml). There is no test or lint script configured.

## Tech stack

- **React Native** 0.81 + **React** 19 on **Expo SDK 54**
- **Expo Router** v6 — file-based routing (see below)
- **TypeScript** (strict-ish, `~5.9`)
- **NativeWind v4** + **Tailwind** 3.4 — styling via `className` on RN components
- **axios** for HTTP, **zustand** for state (available; screens currently fetch locally)
- **react-native-reanimated** v4 (+ worklets), **react-native-gesture-handler**, **react-native-toast-message**

## Architecture

File-based routing under `app/`, split into `(auth)` and `(app)` groups:

| Route | File | Purpose |
|-------|------|---------|
| `/login` | `app/(auth)/login.tsx` | Sign in / sign up |
| `/` | `app/(app)/index.tsx` | Home — list of places |
| `/create` | `app/(app)/create.tsx` | Create a place |
| `/place/[id]` | `app/(app)/place/[id].tsx` | Place detail + delete + Google Maps link |
| `/edit/[id]` | `app/(app)/edit/[id].tsx` | Edit a place |
| `/memories` | `app/(app)/memories.tsx` | Entry point into Wrapped |
| `/roulette` | `app/(app)/roulette.tsx` | Spin-the-wheel picker over saved spots + manual entries |
| `/wrapped` | `app/(app)/wrapped.tsx` | Spotify Wrapped-style yearly recap |
| — | `app/_layout.tsx`, `app/(app)/_layout.tsx`, `app/(auth)/_layout.tsx` | Root/group layouts (Stack + navigation config) |

Shared UI lives in `components/`: `ScreenWrapper`, `ScreenHeader`, `AppButton`, `PlaceCard`, `StarRating`, `PageLoader`, `BottomNav`, `Toast`, `SpinningWheel`, `receipt` (receipt-style card primitives used by Wrapped). Reuse these instead of hand-rolling layout/buttons — they encode the retro dark/amber design system.

## Backend / API

- Supabase (Postgres + Auth + Row Level Security). Client lives in `services/supabase.ts` — import it rather than creating new clients.
- Auth-gated: routes under `(app)` require a signed-in user; unauthenticated users are routed to `(auth)/login`.
- Places are fetched/mutated through `stores/placesStore.ts` (zustand), which talks to Supabase directly — there is no separate REST API layer.
- Wrapped stats are derived client-side in `lib/wrappedStats.ts` from the places already in the store.

### Data model (`types/place.ts`)

```ts
interface Place {
  id: number;
  user_id: string;
  name: string;
  address: string | null;
  rating: number | null;
  pros: string[];
  cons: string[];
  favorite_dishes: string[];
  latitude?: number | null;
  longitude?: number | null;
  visited_at?: string | null;
  created_at?: string;
}
```

## Conventions

- Style with NativeWind `className` (Tailwind classes), not `StyleSheet`.
- Screens re-fetch on focus with `useFocusEffect` for fresh data (pull-to-refresh via `FlatList` `onRefresh`).
- Keep the aesthetic: dark cinematic background, orange/amber accents, retro-diner feel.

## Roadmap

Shipped: Supabase migration (auth, cloud sync, RLS), Roulette, Wrapped, Google Maps deep link.

Not yet built:
- **v1.2** — Search, place images, PlaceCard polish
- **v2.0** — "AI Pick For Us", Wrapped image export/sharing, smart recommendations
