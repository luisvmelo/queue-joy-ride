export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      parties: {
        Row: {
          arrived_at: string | null
          confirmed_by_receptionist: boolean | null
          created_at: string | null
          estimated_wait_minutes: number | null
          id: string
          initial_position: number | null
          joined_at: string | null
          name: string
          notification_type: string | null
          notified_next_at: string | null
          notified_ready_at: string | null
          party_size: number
          phone: string
          queue_position: number | null
          removed_at: string | null
          restaurant_id: string | null
          seated_at: string | null
          status: string | null
          tolerance_minutes: number | null
          updated_at: string | null
          wait_min: number | null
        }
        Insert: {
          arrived_at?: string | null
          confirmed_by_receptionist?: boolean | null
          created_at?: string | null
          estimated_wait_minutes?: number | null
          id?: string
          initial_position?: number | null
          joined_at?: string | null
          name: string
          notification_type?: string | null
          notified_next_at?: string | null
          notified_ready_at?: string | null
          party_size: number
          phone: string
          queue_position?: number | null
          removed_at?: string | null
          restaurant_id?: string | null
          seated_at?: string | null
          status?: string | null
          tolerance_minutes?: number | null
          updated_at?: string | null
          wait_min?: number | null
        }
        Update: {
          arrived_at?: string | null
          confirmed_by_receptionist?: boolean | null
          created_at?: string | null
          estimated_wait_minutes?: number | null
          id?: string
          initial_position?: number | null
          joined_at?: string | null
          name?: string
          notification_type?: string | null
          notified_next_at?: string | null
          notified_ready_at?: string | null
          party_size?: number
          phone?: string
          queue_position?: number | null
          removed_at?: string | null
          restaurant_id?: string | null
          seated_at?: string | null
          status?: string | null
          tolerance_minutes?: number | null
          updated_at?: string | null
          wait_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parties_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_queue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "parties_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      queue_history: {
        Row: {
          called_at: string | null
          cancelled_at: string | null
          created_at: string | null
          final_status: string | null
          id: string
          joined_at: string
          name: string
          party_id: string | null
          party_size: number
          phone: string
          queue_position: number
          restaurant_id: string | null
          seated_at: string | null
          wait_time_minutes: number | null
        }
        Insert: {
          called_at?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          final_status?: string | null
          id?: string
          joined_at: string
          name: string
          party_id?: string | null
          party_size: number
          phone: string
          queue_position: number
          restaurant_id?: string | null
          seated_at?: string | null
          wait_time_minutes?: number | null
        }
        Update: {
          called_at?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          final_status?: string | null
          id?: string
          joined_at?: string
          name?: string
          party_id?: string | null
          party_size?: number
          phone?: string
          queue_position?: number
          restaurant_id?: string | null
          seated_at?: string | null
          wait_time_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_history_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_history_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_queue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "queue_history_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_staff: {
        Row: {
          created_at: string | null
          id: string
          restaurant_id: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          restaurant_id?: string | null
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          restaurant_id?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_staff_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_queue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_staff_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          avg_seat_time_minutes: number | null
          created_at: string | null
          default_tolerance_minutes: number
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          menu_url: string | null
          name: string
          opening_hours: Json | null
          owner_id: string | null
          phone: string | null
          tolerance_minutes: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          avg_seat_time_minutes?: number | null
          created_at?: string | null
          default_tolerance_minutes?: number
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          menu_url?: string | null
          name: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          tolerance_minutes?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          avg_seat_time_minutes?: number | null
          created_at?: string | null
          default_tolerance_minutes?: number
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          menu_url?: string | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          tolerance_minutes?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      restaurant_queue_stats: {
        Row: {
          avg_wait_time_today: number | null
          max_wait_time_today: number | null
          min_wait_time_today: number | null
          restaurant_id: string | null
          restaurant_name: string | null
          total_served_today: number | null
        }
        Relationships: []
      }
      v_avg_wait_by_position: {
        Row: {
          avg_wait_min: number | null
          initial_position: number | null
          restaurant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parties_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_queue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "parties_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_restaurant_wait_stats: {
        Row: {
          avg_step_wait_min: number | null
          restaurant_id: string | null
          samples: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parties_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_queue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "parties_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      confirm_party_arrival: {
        Args: { party_uuid: string }
        Returns: boolean
      }
      get_restaurant_queue: {
        Args: { restaurant_uuid: string }
        Returns: {
          party_id: string
          name: string
          phone: string
          party_size: number
          status: string
          queue_position: number
          joined_at: string
          notified_ready_at: string
          tolerance_minutes: number
        }[]
      }
      mark_party_no_show: {
        Args: { party_uuid: string }
        Returns: boolean
      }
      move_party_to_next_position: {
        Args: { party_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      user_type: "owner" | "admin" | "receptionist"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_type: ["owner", "admin", "receptionist"],
    },
  },
} as const
