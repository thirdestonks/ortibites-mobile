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
}

interface PlacesState {
  places: Place[]
  loading: boolean
  fetchPlaces: () => Promise<void>
  fetchPlace: (id: number | string) => Promise<Place | null>
  createPlace: (input: NewPlace) => Promise<{ error: string | null }>
  updatePlace: (id: number | string, input: Partial<NewPlace>) => Promise<{ error: string | null }>
  deletePlace: (id: number | string) => Promise<{ error: string | null }>
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
}))
