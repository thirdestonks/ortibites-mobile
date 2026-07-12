export interface Place {
  id: number
  user_id: string
  name: string
  address: string | null
  rating: number | null
  pros: string[]
  cons: string[]
  favorite_dishes: string[]
  latitude?: number | null
  longitude?: number | null
  visited_at?: string | null
  created_at?: string
}
