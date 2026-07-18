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
  fetchPlaces: () => Promise<void>
  fetchPlace: (id: number | string) => Promise<Place | null>
  createPlace: (input: NewPlace) => Promise<{ error: string | null }>
  updatePlace: (id: number | string, input: Partial<NewPlace>) => Promise<{ error: string | null }>
  deletePlace: (id: number | string) => Promise<{ error: string | null }>
  incrementRevisit: (id: number) => Promise<void>
}

export const usePlacesStore = create<PlacesState>((set) => ({
  places: [],
  loading: false,

  // RLS scopes this to the current user automatically — no manual user filter.
  fetchPlaces: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .order('created_at', { ascending: false })
    set({ places: error ? [] : (data as Place[]), loading: false })
  },

  fetchPlace: async (id) => {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .eq('id', id)
      .single()
    return error ? null : (data as Place)
  },

  createPlace: async (input) => {
    const { error } = await supabase.from('places').insert({
      ...input,
      visited_at: new Date().toISOString(),
      // user_id is filled by the DB default auth.uid() — never sent from client.
    })
    return { error: error?.message ?? null }
  },

  updatePlace: async (id, input) => {
    const { error } = await supabase.from('places').update(input).eq('id', id)
    return { error: error?.message ?? null }
  },

  deletePlace: async (id) => {
    const { error } = await supabase.from('places').delete().eq('id', id)
    return { error: error?.message ?? null }
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
}))
