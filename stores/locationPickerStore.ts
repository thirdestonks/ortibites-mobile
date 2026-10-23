import { create } from 'zustand'

export interface PickedLocation {
  lat: number
  lng: number
  address: string
}

interface InitialLocation {
  lat: number | null
  lng: number | null
  address: string
}

interface LocationPickerState {
  /** What the picker opens with (the form's current pin, if any). */
  initial: InitialLocation
  /** Set by the picker on confirm; the form takes it once on refocus. */
  result: PickedLocation | null
  open: (initial: InitialLocation) => void
  confirm: (result: PickedLocation) => void
  consume: () => PickedLocation | null
}

// The picker is its own full-screen route, so it hands its answer back through
// this store instead of route params (params can't carry a result upstream).
export const useLocationPickerStore = create<LocationPickerState>((set, get) => ({
  initial: { lat: null, lng: null, address: '' },
  result: null,

  open: (initial) => set({ initial, result: null }),

  confirm: (result) => set({ result }),

  consume: () => {
    const { result } = get()
    if (result) set({ result: null })
    return result
  },
}))
