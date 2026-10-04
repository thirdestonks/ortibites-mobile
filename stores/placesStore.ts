import { create } from 'zustand'
import { supabase } from '../services/supabase'
import type { Place } from '../types/place'

export type NewPlace = {
  name: string
  address?: string
  rating?: number
  pros?: string[]
  cons?: string[]
  favorite_dishes?: string[]
  hub_id?: number | null
  latitude?: number | null
  longitude?: number | null
}

interface PlacesState {
  places: Place[]
  loading: boolean
  /** Reads a place already in memory. Lets screens paint before any network. */
  getCached: (id: number | string) => Place | null
  fetchPlaces: (opts?: { quiet?: boolean }) => Promise<void>
  fetchPlace: (id: number | string) => Promise<Place | null>
  createPlace: (input: NewPlace) => Promise<{ error: string | null }>
  updatePlace: (id: number | string, input: Partial<NewPlace>) => Promise<{ error: string | null }>
  deletePlace: (id: number | string) => Promise<{ error: string | null }>
  incrementRevisit: (id: number) => Promise<void>
  decrementRevisit: (id: number, currentCount: number) => Promise<void>
}

/** Replaces a place in the list, or prepends it if it isn't there yet. */
function upsert(places: Place[], place: Place): Place[] {
  const i = places.findIndex((p) => p.id === place.id)
  if (i === -1) return [place, ...places]
  const next = places.slice()
  next[i] = place
  return next
}

export const usePlacesStore = create<PlacesState>((set, get) => ({
  places: [],
  loading: false,

  getCached: (id) => get().places.find((p) => String(p.id) === String(id)) ?? null,

  // RLS scopes this to the current user automatically — no manual user filter.
  // `quiet` refreshes in the background without flipping `loading`, so a screen
  // that already has data never gets replaced by a spinner. The very first
  // load still shows loading even when quiet, or the empty state would flash.
  fetchPlaces: async (opts) => {
    const hasData = get().places.length > 0
    if (!opts?.quiet || !hasData) set({ loading: true })

    const { data, error } = await supabase
      .from('places')
      .select('*')
      .order('created_at', { ascending: false })

    // A failed quiet refresh keeps whatever is already on screen rather than
    // blanking the list.
    if (error && opts?.quiet && hasData) {
      set({ loading: false })
      return
    }
    set({ places: error ? [] : (data as Place[]), loading: false })
  },

  fetchPlace: async (id) => {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null

    // Feed the fresh row back into the list so the next visit is instant.
    const place = data as Place
    set((s) => ({ places: upsert(s.places, place) }))
    return place
  },

  createPlace: async (input) => {
    const { data, error } = await supabase
      .from('places')
      .insert({
        ...input,
        visited_at: new Date().toISOString(),
        // user_id is filled by the DB default auth.uid() — never sent from client.
      })
      .select()
      .single()

    if (error) return { error: error.message }

    // Land it in the list immediately so Home shows it without waiting on a refetch.
    if (data) set((s) => ({ places: upsert(s.places, data as Place) }))
    return { error: null }
  },

  updatePlace: async (id, input) => {
    const { error } = await supabase.from('places').update(input).eq('id', id)
    if (error) return { error: error.message }

    // Merge locally so the detail screen reflects the edit with no round trip.
    set((s) => ({
      places: s.places.map((p) =>
        String(p.id) === String(id) ? ({ ...p, ...input } as Place) : p
      ),
    }))
    return { error: null }
  },

  deletePlace: async (id) => {
    const { error } = await supabase.from('places').delete().eq('id', id)
    if (error) return { error: error.message }

    set((s) => ({ places: s.places.filter((p) => String(p.id) !== String(id)) }))
    return { error: null }
  },

  incrementRevisit: async (id) => {
    // optimistic bump
    set((s) => ({
      places: s.places.map((p) =>
        p.id === id ? { ...p, revisit_count: (p.revisit_count ?? 0) + 1 } : p
      ),
    }))
    const { error } = await supabase.rpc('increment_revisit', { place_id: id })
    if (error) {
      // rollback on failure
      set((s) => ({
        places: s.places.map((p) =>
          p.id === id
            ? { ...p, revisit_count: Math.max(0, (p.revisit_count ?? 1) - 1) }
            : p
        ),
      }))
    }
  },

  decrementRevisit: async (id, currentCount) => {
    if (currentCount <= 0) return
    const next = currentCount - 1

    // optimistic dip (keeps the home-screen list in sync even though callers
    // also track their own local copy of revisit_count)
    set((s) => ({
      places: s.places.map((p) => (p.id === id ? { ...p, revisit_count: next } : p)),
    }))
    const { error } = await supabase.from('places').update({ revisit_count: next }).eq('id', id)
    if (error) {
      // rollback on failure
      set((s) => ({
        places: s.places.map((p) => (p.id === id ? { ...p, revisit_count: currentCount } : p)),
      }))
    }
  },
}))
