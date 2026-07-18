import { create } from 'zustand'
import { supabase } from '../services/supabase'
import type { Hub } from '../types/hub'

interface HubsState {
  hubs: Hub[]
  loading: boolean
  fetchHubs: () => Promise<void>
  createHub: (name: string) => Promise<{ hub: Hub | null; error: string | null }>
}

export const useHubsStore = create<HubsState>((set, get) => ({
  hubs: [],
  loading: false,

  // RLS scopes to the current user automatically.
  fetchHubs: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('hubs')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    set({ hubs: error ? [] : (data as Hub[]), loading: false })
  },

  // Creates a station; sort_order defaults to end of the current list.
  createHub: async (name) => {
    const trimmed = name.trim()
    if (!trimmed) return { hub: null, error: 'Station name is required' }
    const sort_order = get().hubs.length
    const { data, error } = await supabase
      .from('hubs')
      .insert({ name: trimmed, sort_order })
      .select()
      .single()
    if (error) return { hub: null, error: error.message }
    const hub = data as Hub
    set((s) => ({ hubs: [...s.hubs, hub] }))
    return { hub, error: null }
  },
}))
