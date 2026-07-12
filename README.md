# 🍜 OrtiBites Mobile

A retro-inspired food memory app for Ortigas workers discovering, rating, and revisiting their favorite food spots.

---

# 📖 Description

OrtiBites is a cinematic food journaling mobile app designed for Ortigas workers who constantly explore restaurants, hidden gems, comfort food spots, and memorable dining experiences around the city.

The app focuses on preserving personal food memories rather than functioning as a traditional restaurant directory.

---

# 🍜 About

Built with a retro diner inspired aesthetic, OrtiBites combines:

* personal food tracking
* restaurant discovery
* favorite dishes
* dining pros and cons
* memorable food experiences

into a cozy and visually expressive mobile experience.

Instead of trying to become another generic food finder platform, OrtiBites is designed to feel personal, nostalgic, and cinematic.

---

# ✨ Features

## Core Features

* ✅ Create restaurant entries
* ✅ Edit restaurant entries
* ✅ Delete restaurant entries
* ✅ View restaurant details
* ✅ Store pros and cons
* ✅ Save favorite dishes
* ✅ Restaurant ratings system
* ✅ Pull-to-refresh support

---

# 🎨 UI / UX Highlights

* Retro diner inspired design
* Dark cinematic mobile interface
* Orange / amber accent system
* Smooth fade navigation transitions
* Floating action button support
* Reusable design system components
* Mobile-first responsive layout

---

# 🧱 Tech Stack

## Mobile

* React Native
* Expo SDK 54
* Expo Router
* TypeScript
* NativeWind v4

## Backend

* Supabase (Postgres + Auth + Row Level Security)

### Environment setup

Copy `.env.example` to `.env` and fill in your Supabase project values
(Supabase dashboard → Settings → API):

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

The anon key is public by design — security is enforced by RLS. Restart the dev
server with `pnpm start -c` after editing `.env`.

Database setup lives in `docs/supabase/schema.sql` (table + RLS) and
`docs/supabase/seed.sql` (sample data). New to Supabase/Expo? Read
`docs/supabase-expo-crash-course.md`.

---

# 🛣️ Roadmap

## v1.1.0

* Memories Timeline
* Search functionality
* Better PlaceCard UI polish

## v1.2.0

* Place images
* Maps integration
* Restaurant address improvements

## v2.0

* AI Pick For Us feature
* User authentication
* Cloud sync
* Smart recommendations

---

# 👨‍💻 Author

Built by Me for Me.
