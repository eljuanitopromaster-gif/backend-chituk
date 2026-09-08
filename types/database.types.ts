export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          normalized: string
          bio: string | null
          avatar: string | null
          role: 'owner' | 'mod' | 'creator' | 'user'
          is_verified: boolean
          terms_accepted: boolean
          banned: boolean
          banReason: string | null
          createdAt: string
        }
        Insert: {
          id: string
          username: string
          normalized: string
          bio?: string | null
          avatar?: string | null
          role?: 'owner' | 'mod' | 'creator' | 'user'
          is_verified?: boolean
          terms_accepted?: boolean
          banned?: boolean
          banReason?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          username?: string
          normalized?: string
          bio?: string | null
          avatar?: string | null
          role?: 'owner' | 'mod' | 'creator' | 'user'
          is_verified?: boolean
          terms_accepted?: boolean
          banned?: boolean
          banReason?: string | null
          createdAt?: string
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string
          script: string
          scriptMode: string
          kind: string
          authorId: string
          youtubeUrl: string | null
          destinationUrl: string | null
          image: string | null
          views: number
          unlocks: number
          language: string
          createdAt: string
          status: 'pending' | 'approved' | 'rejected'
          copies: number
          likes: number
        }
        Insert: {
          id: string
          title: string
          description: string
          script: string
          scriptMode: string
          kind: string
          authorId: string
          youtubeUrl?: string | null
          destinationUrl?: string | null
          image?: string | null
          views?: number
          unlocks?: number
          language?: string
          createdAt?: string
          status?: 'pending' | 'approved' | 'rejected'
          copies?: number
          likes?: number
        }
        Update: {
          id?: string
          title?: string
          description?: string
          script?: string
          scriptMode?: string
          kind?: string
          authorId?: string
          youtubeUrl?: string | null
          destinationUrl?: string | null
          image?: string | null
          views?: number
          unlocks?: number
          language?: string
          createdAt?: string
          status?: 'pending' | 'approved' | 'rejected'
          copies?: number
          likes?: number
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          actor_id: string
          type: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          actor_id: string
          type: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          actor_id?: string
          type?: string
          read?: boolean
          created_at?: string
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_name: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_name: string
          unlocked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_name?: string
          unlocked_at?: string
        }
      }
    }
  }
}
