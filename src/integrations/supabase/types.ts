export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          link_series_id: string | null
          sort_order: number
          subtitle: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_series_id?: string | null
          sort_order?: number
          subtitle?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_series_id?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "banners_link_series_id_fkey"
            columns: ["link_series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      coin_packages: {
        Row: {
          coins: number
          id: string
          is_active: boolean
          price_cents: number
          stripe_price_id: string | null
          title: string
        }
        Insert: {
          coins: number
          id?: string
          is_active?: boolean
          price_cents: number
          stripe_price_id?: string | null
          title: string
        }
        Update: {
          coins?: number
          id?: string
          is_active?: boolean
          price_cents?: number
          stripe_price_id?: string | null
          title?: string
        }
        Relationships: []
      }
      episode_favorites: {
        Row: {
          created_at: string | null
          episode_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          episode_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          episode_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "episode_favorites_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      episode_likes: {
        Row: {
          created_at: string | null
          episode_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          episode_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          episode_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "episode_likes_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      episode_unlocks: {
        Row: {
          episode_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          episode_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          episode_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "episode_unlocks_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          created_at: string
          duration_seconds: number | null
          episode_number: number
          id: string
          is_free: boolean
          is_published: boolean
          price_coins: number
          series_id: string
          title: string
          video_url: string | null
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          episode_number: number
          id?: string
          is_free?: boolean
          is_published?: boolean
          price_coins?: number
          series_id: string
          title: string
          video_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          episode_number?: number
          id?: string
          is_free?: boolean
          is_published?: boolean
          price_coins?: number
          series_id?: string
          title?: string
          video_url?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "episodes_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auto_unlock: boolean
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          auto_unlock?: boolean
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          auto_unlock?: boolean
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      series: {
        Row: {
          category_id: string | null
          cover_url: string | null
          created_at: string
          free_episodes: number
          id: string
          is_published: boolean
          slug: string
          synopsis: string | null
          title: string
          total_episodes: number
        }
        Insert: {
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          free_episodes?: number
          id?: string
          is_published?: boolean
          slug: string
          synopsis?: string | null
          title: string
          total_episodes?: number
        }
        Update: {
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          free_episodes?: number
          id?: string
          is_published?: boolean
          slug?: string
          synopsis?: string | null
          title?: string
          total_episodes?: number
        }
        Relationships: [
          {
            foreignKeyName: "series_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      series_unlocks: {
        Row: {
          id: string
          series_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          series_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          series_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_unlocks_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          coins: number
          created_at: string
          id: string
          reason: Database["public"]["Enums"]["transaction_reason"]
          ref_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          coins: number
          created_at?: string
          id?: string
          reason: Database["public"]["Enums"]["transaction_reason"]
          ref_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          coins?: number
          created_at?: string
          id?: string
          reason?: Database["public"]["Enums"]["transaction_reason"]
          ref_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          id: string
          last_episode_number: number
          last_position_seconds: number
          series_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          last_episode_number?: number
          last_position_seconds?: number
          series_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          last_episode_number?: number
          last_position_seconds?: number
          series_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      views: {
        Row: {
          created_at: string
          episode_id: string
          id: string
          series_id: string
          user_id: string | null
          watched_seconds: number
        }
        Insert: {
          created_at?: string
          episode_id: string
          id?: string
          series_id: string
          user_id?: string | null
          watched_seconds?: number
        }
        Update: {
          created_at?: string
          episode_id?: string
          id?: string
          series_id?: string
          user_id?: string | null
          watched_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "views_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "views_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      transaction_reason:
        | "purchase"
        | "episode_unlock"
        | "series_unlock"
        | "admin_adjust"
      transaction_type: "credit" | "debit"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      transaction_reason: [
        "purchase",
        "episode_unlock",
        "series_unlock",
        "admin_adjust",
      ],
      transaction_type: ["credit", "debit"],
    },
  },
} as const
