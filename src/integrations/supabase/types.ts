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
          id: string
          joined_at: string | null
          name: string
          notification_type: string
          notified_next_at: string | null
          notified_ready_at: string | null
          party_size: number
          phone: string
          queue_position: number | null
          removed_at: string | null
          restaurant_id: string | null
          seated_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          arrived_at?: string | null
          confirmed_by_receptionist?: boolean | null
          created_at?: string | null
          id?: string
          joined_at?: string | null
          name: string
          notification_type: string
          notified_next_at?: string | null
          notified_ready_at?: string | null
          party_size: number
          phone: string
          queue_position?: number | null
          removed_at?: string | null
          restaurant_id?: string | null
          seated_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          arrived_at?: string | null
          confirmed_by_receptionist?: boolean | null
          created_at?: string | null
          id?: string
          joined_at?: string | null
          name?: string
          notification_type?: string
          notified_next_at?: string | null
          notified_ready_at?: string | null
          party_size?: number
          phone?: string
          queue_position?: number | null
          removed_at?: string | null
          restaurant_id?: string | null
          seated_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parties_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_position_analytics: {
        Row: {
          id: string
          party_id: string
          queue_position: number
          recorded_at: string
          restaurant_id: string
          time_to_seat_minutes: number
        }
        Insert: {
          id?: string
          party_id: string
          queue_position: number
          recorded_at?: string
          restaurant_id: string
          time_to_seat_minutes: number
        }
        Update: {
          id?: string
          party_id?: string
          queue_position?: number
          recorded_at?: string
          restaurant_id?: string
          time_to_seat_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "queue_position_analytics_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_position_analytics_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          avg_seat_time_minutes: number | null
          created_at: string | null
          id: string
          menu_url: string | null
          name: string
          tolerance_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          avg_seat_time_minutes?: number | null
          created_at?: string | null
          id?: string
          menu_url?: string | null
          name: string
          tolerance_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_seat_time_minutes?: number | null
          created_at?: string | null
          id?: string
          menu_url?: string | null
          name?: string
          tolerance_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_party_arrival: {
        Args: { party_uuid: string }
        Returns: boolean
      }
      get_average_wait_time_by_position: {
        Args: { restaurant_uuid: string; queue_pos: number }
        Returns: number
      }
      get_restaurant_analytics: {
        Args: { restaurant_uuid: string }
        Returns: {
          avg_wait_time_minutes: number
          avg_abandonment_time_minutes: number
          conversion_rate: number
          peak_hours: Json
          return_customer_rate: number
        }[]
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
