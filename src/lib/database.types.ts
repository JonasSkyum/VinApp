// Generated from project dadhgplpihnyakalicwm via the Supabase MCP (generate_typescript_types).
// Regenerate after every migration. Do not edit by hand.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      answer_log: {
        Row: {
          answered_at: string
          client_id: string
          correct: boolean
          created_at: string
          guessed_id: string | null
          id: number
          item_id: string
          kind: string
          points: number
          tier: string
          user_id: string
        }
        Insert: {
          answered_at: string
          client_id: string
          correct: boolean
          created_at?: string
          guessed_id?: string | null
          id?: never
          item_id: string
          kind: string
          points: number
          tier: string
          user_id: string
        }
        Update: {
          answered_at?: string
          client_id?: string
          correct?: boolean
          created_at?: string
          guessed_id?: string | null
          id?: never
          item_id?: string
          kind?: string
          points?: number
          tier?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_results: {
        Row: {
          created_at: string
          date_key: string
          max: number
          played_at: string
          style_id: string
          tiers: Json
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date_key: string
          max: number
          played_at: string
          style_id: string
          tiers?: Json
          total: number
          user_id: string
        }
        Update: {
          created_at?: string
          date_key?: string
          max?: number
          played_at?: string
          style_id?: string
          tiers?: Json
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      heartbeat: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      leitner_state: {
        Row: {
          box: number
          due_at: string
          reviewed_at: string
          unit_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          box: number
          due_at: string
          reviewed_at: string
          unit_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          box?: number
          due_at?: string
          reviewed_at?: string
          unit_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
