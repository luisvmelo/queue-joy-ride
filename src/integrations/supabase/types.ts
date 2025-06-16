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
            foreignKeyName: "fk_parties_restaurant"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
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
            foreignKeyName: "fk_queue_history_restaurant"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "fk_staff_restaurant"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
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
          category: string | null
          created_at: string | null
          current_event: string | null
          default_tolerance_minutes: number
          description: string | null
          email: string | null
          event_type: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
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
          category?: string | null
          created_at?: string | null
          current_event?: string | null
          default_tolerance_minutes?: number
          description?: string | null
          email?: string | null
          event_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
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
          category?: string | null
          created_at?: string | null
          current_event?: string | null
          default_tolerance_minutes?: number
          description?: string | null
          email?: string | null
          event_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
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
      [_ in never]: never
    }
    Functions: {
      call_next_in_queue: {
        Args: { p_restaurant_id: string }
        Returns: {
          party_id: string
          name: string
          phone: string
          party_size: number
        }[]
      }
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
      get_restaurants_with_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          address: string
          phone: string
          is_active: boolean
          menu_url: string
          avg_seat_time_minutes: number
          category: string
          current_event: string
          event_type: string
          image_url: string
          latitude: number
          longitude: number
          queue_size: number
          min_wait_time: number
        }[]
      }
      get_user_restaurant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      handle_no_show: {
        Args: { party_uuid: string }
        Returns: boolean
      }
      mark_party_no_show: {
        Args: { party_uuid: string }
        Returns: boolean
      }
      move_party_to_next_position: {
        Args: { party_uuid: string }
        Returns: boolean
      }
      user_owns_restaurant: {
        Args: { restaurant_uuid: string }
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
