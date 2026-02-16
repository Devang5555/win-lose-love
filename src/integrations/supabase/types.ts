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
      batches: {
        Row: {
          available_seats: number | null
          batch_name: string
          batch_size: number
          created_at: string | null
          end_date: string
          id: string
          price_override: number | null
          seats_booked: number
          start_date: string
          status: string
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          available_seats?: number | null
          batch_name: string
          batch_size?: number
          created_at?: string | null
          end_date: string
          id?: string
          price_override?: number | null
          seats_booked?: number
          start_date: string
          status?: string
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          available_seats?: number | null
          batch_name?: string
          batch_size?: number
          created_at?: string | null
          end_date?: string
          id?: string
          price_override?: number | null
          seats_booked?: number
          start_date?: string
          status?: string
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batches_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["trip_id"]
          },
        ]
      }
      bookings: {
        Row: {
          advance_paid: number
          advance_screenshot_url: string | null
          batch_id: string | null
          booking_status: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          notes: string | null
          num_travelers: number
          payment_status: string
          phone: string
          pickup_location: string | null
          rejection_reason: string | null
          remaining_payment_status: string | null
          remaining_payment_uploaded_at: string | null
          remaining_payment_verified_at: string | null
          remaining_screenshot_url: string | null
          total_amount: number
          trip_id: string
          updated_at: string | null
          user_id: string | null
          verified_by_admin_id: string | null
        }
        Insert: {
          advance_paid?: number
          advance_screenshot_url?: string | null
          batch_id?: string | null
          booking_status?: string
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          notes?: string | null
          num_travelers?: number
          payment_status?: string
          phone: string
          pickup_location?: string | null
          rejection_reason?: string | null
          remaining_payment_status?: string | null
          remaining_payment_uploaded_at?: string | null
          remaining_payment_verified_at?: string | null
          remaining_screenshot_url?: string | null
          total_amount: number
          trip_id: string
          updated_at?: string | null
          user_id?: string | null
          verified_by_admin_id?: string | null
        }
        Update: {
          advance_paid?: number
          advance_screenshot_url?: string | null
          batch_id?: string | null
          booking_status?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          num_travelers?: number
          payment_status?: string
          phone?: string
          pickup_location?: string | null
          rejection_reason?: string | null
          remaining_payment_status?: string | null
          remaining_payment_uploaded_at?: string | null
          remaining_payment_verified_at?: string | null
          remaining_screenshot_url?: string | null
          total_amount?: number
          trip_id?: string
          updated_at?: string | null
          user_id?: string | null
          verified_by_admin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          created_at: string | null
          description: string | null
          hero_image: string | null
          id: string
          name: string
          slug: string
          state: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          hero_image?: string | null
          id?: string
          name: string
          slug: string
          state: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          hero_image?: string | null
          id?: string
          name?: string
          slug?: string
          state?: string
        }
        Relationships: []
      }
      interested_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string
          preferred_month: string | null
          trip_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone: string
          preferred_month?: string | null
          trip_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string
          preferred_month?: string | null
          trip_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          id: string
          payment_method: string
          status: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          id?: string
          payment_method?: string
          status?: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          id?: string
          payment_method?: string
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trips: {
        Row: {
          advance_amount: number | null
          base_price: number | null
          booking_live: boolean | null
          capacity: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          destination_id: string | null
          duration: string
          duration_days: number | null
          exclusions: string[] | null
          highlights: string[] | null
          id: string
          images: string[] | null
          inclusions: string[] | null
          is_active: boolean | null
          locations: string[] | null
          notes: string | null
          overview: string | null
          price_default: number
          price_from_mumbai: number | null
          price_from_pune: number | null
          slug: string | null
          summary: string | null
          trip_id: string
          trip_name: string
          updated_at: string | null
        }
        Insert: {
          advance_amount?: number | null
          base_price?: number | null
          booking_live?: boolean | null
          capacity?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          destination_id?: string | null
          duration: string
          duration_days?: number | null
          exclusions?: string[] | null
          highlights?: string[] | null
          id?: string
          images?: string[] | null
          inclusions?: string[] | null
          is_active?: boolean | null
          locations?: string[] | null
          notes?: string | null
          overview?: string | null
          price_default?: number
          price_from_mumbai?: number | null
          price_from_pune?: number | null
          slug?: string | null
          summary?: string | null
          trip_id: string
          trip_name: string
          updated_at?: string | null
        }
        Update: {
          advance_amount?: number | null
          base_price?: number | null
          booking_live?: boolean | null
          capacity?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          destination_id?: string | null
          duration?: string
          duration_days?: number | null
          exclusions?: string[] | null
          highlights?: string[] | null
          id?: string
          images?: string[] | null
          inclusions?: string[] | null
          is_active?: boolean | null
          locations?: string[] | null
          notes?: string | null
          overview?: string | null
          price_default?: number
          price_from_mumbai?: number | null
          price_from_pune?: number | null
          slug?: string | null
          summary?: string | null
          trip_id?: string
          trip_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
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
      wishlist: {
        Row: {
          created_at: string
          id: string
          price_at_save: number | null
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          price_at_save?: number | null
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          price_at_save?: number | null
          trip_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_booking_after_payment: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      create_booking_atomic: {
        Args: {
          p_batch_id: string
          p_total_amount: number
          p_travelers: number
          p_trip_id: string
          p_user_id: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_seats_booked: {
        Args: { batch_id_param: string; seats_count: number }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
