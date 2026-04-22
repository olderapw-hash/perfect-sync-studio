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
      app_settings: {
        Row: {
          icon_base_url: string
          id: number
          logo_url: string | null
          primary_color: string | null
          pw_api_base_url: string | null
          pw_api_secret: string | null
          server_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          icon_base_url?: string
          id?: number
          logo_url?: string | null
          primary_color?: string | null
          pw_api_base_url?: string | null
          pw_api_secret?: string | null
          server_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          icon_base_url?: string
          id?: number
          logo_url?: string | null
          primary_color?: string | null
          pw_api_base_url?: string | null
          pw_api_secret?: string | null
          server_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      character_photos: {
        Row: {
          public_url: string
          roleid: number
          storage_path: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          public_url: string
          roleid: number
          storage_path: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          public_url?: string
          roleid?: number
          storage_path?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      class_photos: {
        Row: {
          cls: number
          public_url: string
          storage_path: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cls: number
          public_url: string
          storage_path: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cls?: number
          public_url?: string
          storage_path?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      item_catalogs: {
        Row: {
          created_at: string
          icons_prefix: string
          id: string
          is_active: boolean
          item_count: number
          name: string
          tab_path: string
        }
        Insert: {
          created_at?: string
          icons_prefix?: string
          id?: string
          is_active?: boolean
          item_count?: number
          name: string
          tab_path: string
        }
        Update: {
          created_at?: string
          icons_prefix?: string
          id?: string
          is_active?: boolean
          item_count?: number
          name?: string
          tab_path?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string
          icon_base_url: string | null
          id: string
          logo_url: string | null
          onboarding_completed: boolean
          owner_id: string
          primary_color: string | null
          pw_api_base_url: string | null
          pw_api_secret: string | null
          server_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon_base_url?: string | null
          id?: string
          logo_url?: string | null
          onboarding_completed?: boolean
          owner_id: string
          primary_color?: string | null
          pw_api_base_url?: string | null
          pw_api_secret?: string | null
          server_name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon_base_url?: string | null
          id?: string
          logo_url?: string | null
          onboarding_completed?: boolean
          owner_id?: string
          primary_color?: string | null
          pw_api_base_url?: string | null
          pw_api_secret?: string | null
          server_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_grant_admin: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          has_subscription: boolean
          is_admin: boolean
          is_superadmin: boolean
          onboarding_completed: boolean
          tenant_server_name: string
          user_id: string
        }[]
      }
      admin_revoke_admin: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      get_my_tenant_secret: { Args: never; Returns: string }
      get_public_branding: {
        Args: never
        Returns: {
          logo_url: string
          primary_color: string
          server_name: string
        }[]
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "superadmin"
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
      app_role: ["admin", "user", "superadmin"],
    },
  },
} as const
