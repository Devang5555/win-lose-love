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
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
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
      blog_posts: {
        Row: {
          author: string
          content: string | null
          created_at: string
          destination_id: string | null
          excerpt: string | null
          featured_image: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          content?: string | null
          created_at?: string
          destination_id?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          content?: string | null
          created_at?: string
          destination_id?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          advance_paid: number
          advance_screenshot_url: string | null
          batch_id: string | null
          booking_status: string
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string
          full_name: string
          id: string
          is_deleted: boolean
          notes: string | null
          num_travelers: number
          payment_status: string
          phone: string
          pickup_location: string | null
          referral_code_used: string | null
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
          wallet_discount: number | null
          whatsapp_optin: boolean | null
        }
        Insert: {
          advance_paid?: number
          advance_screenshot_url?: string | null
          batch_id?: string | null
          booking_status?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email: string
          full_name: string
          id?: string
          is_deleted?: boolean
          notes?: string | null
          num_travelers?: number
          payment_status?: string
          phone: string
          pickup_location?: string | null
          referral_code_used?: string | null
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
          wallet_discount?: number | null
          whatsapp_optin?: boolean | null
        }
        Update: {
          advance_paid?: number
          advance_screenshot_url?: string | null
          batch_id?: string | null
          booking_status?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string
          full_name?: string
          id?: string
          is_deleted?: boolean
          notes?: string | null
          num_travelers?: number
          payment_status?: string
          phone?: string
          pickup_location?: string | null
          referral_code_used?: string | null
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
          wallet_discount?: number | null
          whatsapp_optin?: boolean | null
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
      broadcast_messages: {
        Row: {
          audience_filter: Json | null
          audience_type: string
          created_at: string
          created_by: string
          failed_count: number
          id: string
          message_template: string
          recipient_count: number
          sent_at: string | null
          sent_count: number
          status: string
          updated_at: string
        }
        Insert: {
          audience_filter?: Json | null
          audience_type?: string
          created_at?: string
          created_by: string
          failed_count?: number
          id?: string
          message_template: string
          recipient_count?: number
          sent_at?: string | null
          sent_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          audience_filter?: Json | null
          audience_type?: string
          created_at?: string
          created_by?: string
          failed_count?: number
          id?: string
          message_template?: string
          recipient_count?: number
          sent_at?: string | null
          sent_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      internal_config: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          contacted_at: string | null
          created_at: string
          destination_interest: string | null
          email: string
          id: string
          name: string
          phone: string | null
          source: string
          status: string
          updated_at: string
          user_id: string | null
          wallet_credited: boolean
        }
        Insert: {
          contacted_at?: string | null
          created_at?: string
          destination_interest?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          wallet_credited?: boolean
        }
        Update: {
          contacted_at?: string | null
          created_at?: string
          destination_interest?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          wallet_credited?: boolean
        }
        Relationships: []
      }
      payment_reminders: {
        Row: {
          booking_id: string
          channel: string
          created_at: string
          id: string
          message: string | null
          sent_at: string
          sent_by: string
        }
        Insert: {
          booking_id: string
          channel?: string
          created_at?: string
          id?: string
          message?: string | null
          sent_at?: string
          sent_by: string
        }
        Update: {
          booking_id?: string
          channel?: string
          created_at?: string
          id?: string
          message?: string | null
          sent_at?: string
          sent_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
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
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
          uses_count: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
          uses_count?: number
        }
        Relationships: []
      }
      referral_earnings: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          id: string
          referred_user_id: string
          referrer_user_id: string
          status: string
        }
        Insert: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_user_id: string
          status?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_earnings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          processed_at: string | null
          reason: string | null
          refund_status: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          processed_at?: string | null
          reason?: string | null
          refund_status?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          processed_at?: string | null
          reason?: string | null
          refund_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          is_verified: boolean
          is_visible: boolean
          rating: number
          review_text: string | null
          trip_id: string
          user_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          is_verified?: boolean
          is_visible?: boolean
          rating: number
          review_text?: string | null
          trip_id: string
          user_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          is_verified?: boolean
          is_visible?: boolean
          rating?: number
          review_text?: string | null
          trip_id?: string
          user_id?: string
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
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_consents: {
        Row: {
          created_at: string
          id: string
          opted_in: boolean
          opted_in_at: string
          opted_out_at: string | null
          phone: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          opted_in?: boolean
          opted_in_at?: string
          opted_out_at?: string | null
          phone: string
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          opted_in?: boolean
          opted_in_at?: string
          opted_out_at?: string | null
          phone?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_message_logs: {
        Row: {
          broadcast_id: string | null
          created_at: string
          error_message: string | null
          id: string
          message_body: string
          message_type: string
          recipient_phone: string
          recipient_user_id: string | null
          sent_at: string | null
          status: string
          whatsapp_message_id: string | null
        }
        Insert: {
          broadcast_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message_body: string
          message_type?: string
          recipient_phone: string
          recipient_user_id?: string | null
          sent_at?: string | null
          status?: string
          whatsapp_message_id?: string | null
        }
        Update: {
          broadcast_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message_body?: string
          message_type?: string
          recipient_phone?: string
          recipient_user_id?: string | null
          sent_at?: string | null
          status?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_logs_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "broadcast_messages"
            referencedColumns: ["id"]
          },
        ]
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
      apply_wallet_to_booking: {
        Args: { p_amount: number; p_booking_id: string; p_user_id: string }
        Returns: boolean
      }
      cancel_booking_with_seat_release: {
        Args: {
          p_booking_id: string
          p_reason: string
          p_refund_amount?: number
        }
        Returns: undefined
      }
      confirm_booking_after_payment: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      create_audit_log: {
        Args: {
          p_action_type: string
          p_entity_id: string
          p_entity_type: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: string
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
      credit_referral_reward: {
        Args: {
          p_booking_id: string
          p_referred_user_id: string
          p_referrer_code: string
        }
        Returns: boolean
      }
      generate_referral_code: { Args: { p_user_id: string }; Returns: string }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
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
      app_role:
        | "admin"
        | "user"
        | "super_admin"
        | "operations_manager"
        | "finance_manager"
        | "support_staff"
        | "content_manager"
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
      app_role: [
        "admin",
        "user",
        "super_admin",
        "operations_manager",
        "finance_manager",
        "support_staff",
        "content_manager",
      ],
    },
  },
} as const
