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
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          restaurant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          restaurant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          restaurant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_invoices: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string
          id: string
          pdf_url: string | null
          restaurant_id: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date: string
          id?: string
          pdf_url?: string | null
          restaurant_id?: string | null
          status: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string
          id?: string
          pdf_url?: string | null
          restaurant_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          end_datetime: string
          id: string
          image_url: string | null
          is_active: boolean | null
          restaurant_id: string | null
          start_datetime: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_datetime: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          restaurant_id?: string | null
          start_datetime: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_datetime?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          restaurant_id?: string | null
          start_datetime?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
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
      restaurant_settings: {
        Row: {
          auto_close_at_limit: boolean | null
          created_at: string | null
          crm_api_key: string | null
          favicon_url: string | null
          google_font: string | null
          id: string
          max_queue_size: number | null
          min_password_length: number | null
          notification_channels: string[] | null
          peak_alert_staff: boolean | null
          pos_api_key: string | null
          primary_color: string | null
          reminder_5min: boolean | null
          require_2fa: boolean | null
          require_numbers: boolean | null
          require_uppercase: boolean | null
          restaurant_id: string | null
          secondary_color: string | null
          tags: string[] | null
          updated_at: string | null
          visible_in_guide: boolean | null
          webhook_url: string | null
          welcome_message: string | null
        }
        Insert: {
          auto_close_at_limit?: boolean | null
          created_at?: string | null
          crm_api_key?: string | null
          favicon_url?: string | null
          google_font?: string | null
          id?: string
          max_queue_size?: number | null
          min_password_length?: number | null
          notification_channels?: string[] | null
          peak_alert_staff?: boolean | null
          pos_api_key?: string | null
          primary_color?: string | null
          reminder_5min?: boolean | null
          require_2fa?: boolean | null
          require_numbers?: boolean | null
          require_uppercase?: boolean | null
          restaurant_id?: string | null
          secondary_color?: string | null
          tags?: string[] | null
          updated_at?: string | null
          visible_in_guide?: boolean | null
          webhook_url?: string | null
          welcome_message?: string | null
        }
        Update: {
          auto_close_at_limit?: boolean | null
          created_at?: string | null
          crm_api_key?: string | null
          favicon_url?: string | null
          google_font?: string | null
          id?: string
          max_queue_size?: number | null
          min_password_length?: number | null
          notification_channels?: string[] | null
          peak_alert_staff?: boolean | null
          pos_api_key?: string | null
          primary_color?: string | null
          reminder_5min?: boolean | null
          require_2fa?: boolean | null
          require_numbers?: boolean | null
          require_uppercase?: boolean | null
          restaurant_id?: string | null
          secondary_color?: string | null
          tags?: string[] | null
          updated_at?: string | null
          visible_in_guide?: boolean | null
          webhook_url?: string | null
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
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
      restaurant_staff_invites: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invite_token: string
          name: string
          restaurant_id: string | null
          role: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invite_token: string
          name: string
          restaurant_id?: string | null
          role: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invite_token?: string
          name?: string
          restaurant_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_staff_invites_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          avg_seat_time_minutes: number | null
          category: string | null
          city: string | null
          closing_time: string | null
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
          logo_url: string | null
          longitude: number | null
          max_queue_size: number | null
          menu_url: string | null
          name: string
          opening_hours: Json | null
          opening_time: string | null
          owner_id: string | null
          phone: string | null
          plan_type: string | null
          state: string | null
          street: string | null
          tolerance_minutes: number | null
          updated_at: string | null
          website: string | null
          zipcode: string | null
        }
        Insert: {
          address?: string | null
          avg_seat_time_minutes?: number | null
          category?: string | null
          city?: string | null
          closing_time?: string | null
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
          logo_url?: string | null
          longitude?: number | null
          max_queue_size?: number | null
          menu_url?: string | null
          name: string
          opening_hours?: Json | null
          opening_time?: string | null
          owner_id?: string | null
          phone?: string | null
          plan_type?: string | null
          state?: string | null
          street?: string | null
          tolerance_minutes?: number | null
          updated_at?: string | null
          website?: string | null
          zipcode?: string | null
        }
        Update: {
          address?: string | null
          avg_seat_time_minutes?: number | null
          category?: string | null
          city?: string | null
          closing_time?: string | null
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
          logo_url?: string | null
          longitude?: number | null
          max_queue_size?: number | null
          menu_url?: string | null
          name?: string
          opening_hours?: Json | null
          opening_time?: string | null
          owner_id?: string | null
          phone?: string | null
          plan_type?: string | null
          state?: string | null
          street?: string | null
          tolerance_minutes?: number | null
          updated_at?: string | null
          website?: string | null
          zipcode?: string | null
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
      create_customer_party: {
        Args: {
          p_restaurant_id: string
          p_name: string
          p_phone: string
          p_party_size: number
          p_notification_type?: string
        }
        Returns: {
          party_id: string
          queue_position: number
        }[]
      }
      get_customer_party: {
        Args: {
          party_uuid: string
          customer_phone: string
          customer_name: string
        }
        Returns: {
          id: string
          name: string
          phone: string
          party_size: number
          queue_position: number
          initial_position: number
          estimated_wait_minutes: number
          tolerance_minutes: number
          joined_at: string
          status: string
          restaurant_id: string
          restaurant_name: string
          restaurant_menu_url: string
          restaurant_avg_seat_time_minutes: number
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
      get_user_restaurant_ids: {
        Args: Record<PropertyKey, never>
        Returns: {
          restaurant_id: string
        }[]
      }
      handle_no_show: {
        Args: { party_uuid: string }
        Returns: boolean
      }
      log_activity: {
        Args: { p_restaurant_id: string; p_action: string; p_details?: Json }
        Returns: undefined
      }
      mark_party_no_show: {
        Args: { party_uuid: string }
        Returns: boolean
      }
      move_party_to_next_position: {
        Args: { party_uuid: string }
        Returns: boolean
      }
      update_customer_party_status: {
        Args: { party_uuid: string; customer_phone: string; new_status: string }
        Returns: boolean
      }
      user_can_access_restaurant: {
        Args: { restaurant_uuid: string }
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
