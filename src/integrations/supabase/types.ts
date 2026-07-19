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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      marca_events: {
        Row: {
          created_at: string
          data_alvo: string | null
          device_id: string
          id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          data_alvo?: string | null
          device_id: string
          id?: string
          tipo: string
        }
        Update: {
          created_at?: string
          data_alvo?: string | null
          device_id?: string
          id?: string
          tipo?: string
        }
        Relationships: []
      }
      push_burst_sends: {
        Row: {
          device_id: string
          sent_at: string
          sent_on: string
          tipo: string
        }
        Insert: {
          device_id: string
          sent_at?: string
          sent_on?: string
          tipo: string
        }
        Update: {
          device_id?: string
          sent_at?: string
          sent_on?: string
          tipo?: string
        }
        Relationships: []
      }
      push_campaign_sends: {
        Row: {
          campaign_id: string | null
          device_id: string
          error: string | null
          id: string
          run_bucket: string
          sent_at: string
          success: boolean
        }
        Insert: {
          campaign_id?: string | null
          device_id: string
          error?: string | null
          id?: string
          run_bucket: string
          sent_at?: string
          success: boolean
        }
        Update: {
          campaign_id?: string | null
          device_id?: string
          error?: string | null
          id?: string
          run_bucket?: string
          sent_at?: string
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "push_campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "push_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      push_campaigns: {
        Row: {
          active: boolean
          body: string
          created_at: string
          id: string
          last_run_at: string | null
          schedule_cron: string
          slug: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          body: string
          created_at?: string
          id?: string
          last_run_at?: string | null
          schedule_cron: string
          slug: string
          title: string
          updated_at?: string
          url?: string
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          id?: string
          last_run_at?: string | null
          schedule_cron?: string
          slug?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      push_reminders: {
        Row: {
          body: string
          created_at: string
          device_id: string
          error: string | null
          id: string
          marca_key: string
          reminder_index: number
          sent_at: string | null
          tag: string | null
          title: string
          updated_at: string
          url: string
          when_at: string
        }
        Insert: {
          body: string
          created_at?: string
          device_id: string
          error?: string | null
          id?: string
          marca_key: string
          reminder_index?: number
          sent_at?: string | null
          tag?: string | null
          title: string
          updated_at?: string
          url?: string
          when_at: string
        }
        Update: {
          body?: string
          created_at?: string
          device_id?: string
          error?: string | null
          id?: string
          marca_key?: string
          reminder_index?: number
          sent_at?: string | null
          tag?: string | null
          title?: string
          updated_at?: string
          url?: string
          when_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          device_id: string
          endpoint: string
          id: string
          inactivity_stage: number
          install_push_sent_at: string | null
          last_notified_at: string | null
          last_seen_at: string
          locale: string | null
          p256dh: string
          platform: string | null
          tz: string | null
          unsubscribed_at: string | null
          updated_at: string
          user_agent: string | null
          wants_install_push: boolean
        }
        Insert: {
          auth: string
          created_at?: string
          device_id: string
          endpoint: string
          id?: string
          inactivity_stage?: number
          install_push_sent_at?: string | null
          last_notified_at?: string | null
          last_seen_at?: string
          locale?: string | null
          p256dh: string
          platform?: string | null
          tz?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_agent?: string | null
          wants_install_push?: boolean
        }
        Update: {
          auth?: string
          created_at?: string
          device_id?: string
          endpoint?: string
          id?: string
          inactivity_stage?: number
          install_push_sent_at?: string | null
          last_notified_at?: string | null
          last_seen_at?: string
          locale?: string | null
          p256dh?: string
          platform?: string | null
          tz?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_agent?: string | null
          wants_install_push?: boolean
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
    Enums: {},
  },
} as const
