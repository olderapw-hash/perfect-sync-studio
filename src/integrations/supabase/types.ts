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
      admin_files: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          id: string
          mime_type: string | null
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          background_url: string | null
          favicon_url: string | null
          footer_link_label: string | null
          footer_link_url: string | null
          footer_text: string | null
          icon_base_url: string
          id: number
          logo_url: string | null
          primary_color: string | null
          pw_api_base_url: string | null
          pw_api_secret: string | null
          server_name: string
          updated_at: string
          updated_by: string | null
          whatsapp_vps_link: string | null
        }
        Insert: {
          background_url?: string | null
          favicon_url?: string | null
          footer_link_label?: string | null
          footer_link_url?: string | null
          footer_text?: string | null
          icon_base_url?: string
          id?: number
          logo_url?: string | null
          primary_color?: string | null
          pw_api_base_url?: string | null
          pw_api_secret?: string | null
          server_name?: string
          updated_at?: string
          updated_by?: string | null
          whatsapp_vps_link?: string | null
        }
        Update: {
          background_url?: string | null
          favicon_url?: string | null
          footer_link_label?: string | null
          footer_link_url?: string | null
          footer_text?: string | null
          icon_base_url?: string
          id?: number
          logo_url?: string | null
          primary_color?: string | null
          pw_api_base_url?: string | null
          pw_api_secret?: string | null
          server_name?: string
          updated_at?: string
          updated_by?: string | null
          whatsapp_vps_link?: string | null
        }
        Relationships: []
      }
      attendance_claims: {
        Row: {
          claimed_at: string
          claimed_by: string
          date_key: string
          event_id: string
          id: string
          metadata: Json | null
          role_name: string | null
          roleid: number
          streak_count: number
          tenant_id: string
        }
        Insert: {
          claimed_at?: string
          claimed_by: string
          date_key: string
          event_id: string
          id?: string
          metadata?: Json | null
          role_name?: string | null
          roleid: number
          streak_count?: number
          tenant_id: string
        }
        Update: {
          claimed_at?: string
          claimed_by?: string
          date_key?: string
          event_id?: string
          id?: string
          metadata?: Json | null
          role_name?: string | null
          roleid?: number
          streak_count?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_claims_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "attendance_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_claims_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_events: {
        Row: {
          created_at: string
          created_by: string
          daily_reset: boolean
          description: string | null
          id: string
          name: string
          period_end: string | null
          period_start: string | null
          reward_payload: Json
          status_active: boolean
          streak_enabled: boolean
          streak_payload: Json | null
          tenant_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          daily_reset?: boolean
          description?: string | null
          id?: string
          name: string
          period_end?: string | null
          period_start?: string | null
          reward_payload?: Json
          status_active?: boolean
          streak_enabled?: boolean
          streak_payload?: Json | null
          tenant_id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          daily_reset?: boolean
          description?: string | null
          id?: string
          name?: string
          period_end?: string | null
          period_start?: string | null
          reward_payload?: Json
          status_active?: boolean
          streak_enabled?: boolean
          streak_payload?: Json | null
          tenant_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_reward_deliveries: {
        Row: {
          claim_id: string | null
          created_at: string
          date_key: string
          delivered_by: string
          error_message: string | null
          event_id: string
          id: string
          mail_log_ids: string[]
          reward_snapshot: Json
          role_name: string | null
          roleid: number
          status: Database["public"]["Enums"]["attendance_delivery_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          claim_id?: string | null
          created_at?: string
          date_key: string
          delivered_by: string
          error_message?: string | null
          event_id: string
          id?: string
          mail_log_ids?: string[]
          reward_snapshot: Json
          role_name?: string | null
          roleid: number
          status?: Database["public"]["Enums"]["attendance_delivery_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          claim_id?: string | null
          created_at?: string
          date_key?: string
          delivered_by?: string
          error_message?: string | null
          event_id?: string
          id?: string
          mail_log_ids?: string[]
          reward_snapshot?: Json
          role_name?: string | null
          roleid?: number
          status?: Database["public"]["Enums"]["attendance_delivery_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_reward_deliveries_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "attendance_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_reward_deliveries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "attendance_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_reward_deliveries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          error: string | null
          http_status: number | null
          id: string
          metadata: Json | null
          status: string
          target: string | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          error?: string | null
          http_status?: number | null
          id?: string
          metadata?: Json | null
          status?: string
          target?: string | null
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          error?: string | null
          http_status?: number | null
          id?: string
          metadata?: Json | null
          status?: string
          target?: string | null
          tenant_id?: string | null
          user_id?: string
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
      gm_bulk_schedules: {
        Row: {
          command_key: string
          command_payload: Json
          created_at: string
          created_by: string
          day_of_week: number
          id: string
          is_active: boolean
          last_error: string | null
          last_run_at: string | null
          last_run_job_id: string | null
          last_run_status: string | null
          name: string
          selection: Json
          tenant_id: string
          time_utc: string
          timezone: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          command_key: string
          command_payload?: Json
          created_at?: string
          created_by: string
          day_of_week: number
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_run_at?: string | null
          last_run_job_id?: string | null
          last_run_status?: string | null
          name: string
          selection?: Json
          tenant_id: string
          time_utc?: string
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          command_key?: string
          command_payload?: Json
          created_at?: string
          created_by?: string
          day_of_week?: number
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_run_at?: string | null
          last_run_job_id?: string | null
          last_run_status?: string | null
          name?: string
          selection?: Json
          tenant_id?: string
          time_utc?: string
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ingame_events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          ends_at: string | null
          event_type: Database["public"]["Enums"]["ingame_event_type"]
          id: string
          name: string
          reward_message: string | null
          reward_mode: Database["public"]["Enums"]["ingame_reward_mode"]
          reward_payload_json: Json
          reward_title: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["ingame_event_status"]
          tenant_id: string
          updated_at: string
          winners_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["ingame_event_type"]
          id?: string
          name: string
          reward_message?: string | null
          reward_mode?: Database["public"]["Enums"]["ingame_reward_mode"]
          reward_payload_json?: Json
          reward_title?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["ingame_event_status"]
          tenant_id: string
          updated_at?: string
          winners_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["ingame_event_type"]
          id?: string
          name?: string
          reward_message?: string | null
          reward_mode?: Database["public"]["Enums"]["ingame_reward_mode"]
          reward_payload_json?: Json
          reward_title?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["ingame_event_status"]
          tenant_id?: string
          updated_at?: string
          winners_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "ingame_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ingame_participations: {
        Row: {
          added_by: string | null
          created_at: string
          event_id: string
          id: string
          metadata: Json | null
          role_name: string | null
          roleid: number
          source: Database["public"]["Enums"]["ingame_participation_source"]
          tenant_id: string
          userid: number | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          event_id: string
          id?: string
          metadata?: Json | null
          role_name?: string | null
          roleid: number
          source?: Database["public"]["Enums"]["ingame_participation_source"]
          tenant_id: string
          userid?: number | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          event_id?: string
          id?: string
          metadata?: Json | null
          role_name?: string | null
          roleid?: number
          source?: Database["public"]["Enums"]["ingame_participation_source"]
          tenant_id?: string
          userid?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ingame_participations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ingame_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingame_participations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ingame_reward_deliveries: {
        Row: {
          created_at: string
          error_message: string | null
          event_id: string
          id: string
          idempotency_key: string
          mail_log_ids: string[]
          response_json: Json | null
          reward_payload_json: Json
          role_name: string | null
          roleid: number
          sent_at: string | null
          sent_by: string
          status: Database["public"]["Enums"]["ingame_delivery_status"]
          tenant_id: string
          updated_at: string
          userid: number | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_id: string
          id?: string
          idempotency_key: string
          mail_log_ids?: string[]
          response_json?: Json | null
          reward_payload_json: Json
          role_name?: string | null
          roleid: number
          sent_at?: string | null
          sent_by: string
          status?: Database["public"]["Enums"]["ingame_delivery_status"]
          tenant_id: string
          updated_at?: string
          userid?: number | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_id?: string
          id?: string
          idempotency_key?: string
          mail_log_ids?: string[]
          response_json?: Json | null
          reward_payload_json?: Json
          role_name?: string | null
          roleid?: number
          sent_at?: string | null
          sent_by?: string
          status?: Database["public"]["Enums"]["ingame_delivery_status"]
          tenant_id?: string
          updated_at?: string
          userid?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ingame_reward_deliveries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ingame_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingame_reward_deliveries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ingame_winners: {
        Row: {
          drawn_at: string
          drawn_by: string
          event_id: string
          id: string
          role_name: string | null
          roleid: number
          tenant_id: string
          userid: number | null
        }
        Insert: {
          drawn_at?: string
          drawn_by: string
          event_id: string
          id?: string
          role_name?: string | null
          roleid: number
          tenant_id: string
          userid?: number | null
        }
        Update: {
          drawn_at?: string
          drawn_by?: string
          event_id?: string
          id?: string
          role_name?: string | null
          roleid?: number
          tenant_id?: string
          userid?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ingame_winners_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ingame_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingame_winners_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      initial_kits: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          payload: Json
          target_cls: number | null
          tenant_id: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          payload: Json
          target_cls?: number | null
          tenant_id: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          payload?: Json
          target_cls?: number | null
          tenant_id?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "initial_kits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      installer_releases: {
        Row: {
          changelog: string | null
          file_path: string
          file_size_bytes: number | null
          file_url: string
          id: string
          is_current: boolean
          published_at: string
          published_by: string
          version: string
        }
        Insert: {
          changelog?: string | null
          file_path: string
          file_size_bytes?: number | null
          file_url: string
          id?: string
          is_current?: boolean
          published_at?: string
          published_by: string
          version: string
        }
        Update: {
          changelog?: string | null
          file_path?: string
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          is_current?: boolean
          published_at?: string
          published_by?: string
          version?: string
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
      item_favorites: {
        Row: {
          created_at: string
          icon_path: string | null
          id: string
          item_id: number
          max_count: number | null
          metadata: Json | null
          name: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon_path?: string | null
          id?: string
          item_id: number
          max_count?: number | null
          metadata?: Json | null
          name?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon_path?: string | null
          id?: string
          item_id?: number
          max_count?: number | null
          metadata?: Json | null
          name?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_favorites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          activated_at: string | null
          client_email: string | null
          client_name: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          license_key: string
          notes: string | null
          payment_method: string | null
          plan: string
          price_paid: number | null
          status: Database["public"]["Enums"]["license_status"]
          updated_at: string
          vps_activation_token: string | null
          vps_ip: string | null
        }
        Insert: {
          activated_at?: string | null
          client_email?: string | null
          client_name: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          license_key?: string
          notes?: string | null
          payment_method?: string | null
          plan?: string
          price_paid?: number | null
          status?: Database["public"]["Enums"]["license_status"]
          updated_at?: string
          vps_activation_token?: string | null
          vps_ip?: string | null
        }
        Update: {
          activated_at?: string | null
          client_email?: string | null
          client_name?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          license_key?: string
          notes?: string | null
          payment_method?: string | null
          plan?: string
          price_paid?: number | null
          status?: Database["public"]["Enums"]["license_status"]
          updated_at?: string
          vps_activation_token?: string | null
          vps_ip?: string | null
        }
        Relationships: []
      }
      mail_send_log: {
        Row: {
          body: string | null
          created_at: string
          error_message: string | null
          http_status: number | null
          id: string
          kind: string
          payload: Json
          response: Json | null
          status: string
          subject: string | null
          target_name: string | null
          target_roleid: number
          template_id: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          kind: string
          payload: Json
          response?: Json | null
          status: string
          subject?: string | null
          target_name?: string | null
          target_roleid: number
          template_id?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          kind?: string
          payload?: Json
          response?: Json | null
          status?: string
          subject?: string | null
          target_name?: string | null
          target_roleid?: number
          template_id?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_send_log_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "mail_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mail_send_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_templates: {
        Row: {
          body: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          kind: string
          name: string
          payload: Json
          subject: string | null
          tenant_id: string
          updated_at: string
          visibility: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          kind: string
          name: string
          payload: Json
          subject?: string | null
          tenant_id: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          kind?: string
          name?: string
          payload?: Json
          subject?: string | null
          tenant_id?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      server_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          email: string
          expires_at: string
          id: string
          invited_at: string
          invited_by: string
          permissions: Json
          role: Database["public"]["Enums"]["server_role"]
          status: Database["public"]["Enums"]["invite_status"]
          tenant_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_at?: string
          invited_by: string
          permissions?: Json
          role?: Database["public"]["Enums"]["server_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          tenant_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_at?: string
          invited_by?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["server_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "server_invites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      server_members: {
        Row: {
          created_at: string
          id: string
          permissions: Json
          role: Database["public"]["Enums"]["server_role"]
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["server_role"]
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["server_role"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "server_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          content: Json
          id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          id?: number
          updated_at?: string
          updated_by?: string | null
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
          is_trial: boolean
          paddle_customer_id: string | null
          paddle_subscription_id: string | null
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
          is_trial?: boolean
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
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
          is_trial?: boolean
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
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
          connection_error: string | null
          connection_status: string | null
          connection_tested_at: string | null
          created_at: string
          icon_base_url: string | null
          id: string
          is_active: boolean
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
          connection_error?: string | null
          connection_status?: string | null
          connection_tested_at?: string | null
          created_at?: string
          icon_base_url?: string | null
          id?: string
          is_active?: boolean
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
          connection_error?: string | null
          connection_status?: string | null
          connection_tested_at?: string | null
          created_at?: string
          icon_base_url?: string | null
          id?: string
          is_active?: boolean
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
      test_users: {
        Row: {
          created_at: string
          created_by: string
          email: string
          expires_at: string | null
          plan: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          expires_at?: string | null
          plan: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string | null
          plan?: string
          user_id?: string
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
      vps_activations: {
        Row: {
          activated_at: string | null
          activation_token: string
          created_at: string
          hardware_fingerprint: string | null
          hostname: string | null
          id: string
          ip_address: string | null
          last_validated_at: string | null
          notes: string | null
          owner_id: string
          server_id: string | null
          status: Database["public"]["Enums"]["vps_activation_status"]
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          activation_token: string
          created_at?: string
          hardware_fingerprint?: string | null
          hostname?: string | null
          id?: string
          ip_address?: string | null
          last_validated_at?: string | null
          notes?: string | null
          owner_id: string
          server_id?: string | null
          status?: Database["public"]["Enums"]["vps_activation_status"]
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          activation_token?: string
          created_at?: string
          hardware_fingerprint?: string | null
          hostname?: string | null
          id?: string
          ip_address?: string | null
          last_validated_at?: string | null
          notes?: string | null
          owner_id?: string
          server_id?: string | null
          status?: Database["public"]["Enums"]["vps_activation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vps_activations_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_server_invite: { Args: { _invite_id: string }; Returns: string }
      admin_delete_tenant: {
        Args: { target_tenant_id: string }
        Returns: undefined
      }
      admin_grant_admin: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_list_test_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          expires_at: string
          is_expired: boolean
          plan: string
          user_id: string
        }[]
      }
      admin_list_user_tenants: {
        Args: { target_user_id: string }
        Returns: {
          created_at: string
          id: string
          is_active: boolean
          members_count: number
          onboarding_completed: boolean
          server_name: string
        }[]
      }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          current_plan: string
          email: string
          has_subscription: boolean
          is_admin: boolean
          is_superadmin: boolean
          onboarding_completed: boolean
          plan_expires_at: string
          tenant_server_name: string
          tenants_count: number
          user_id: string
        }[]
      }
      admin_purge_user_data: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_register_test_user: {
        Args: {
          _created_by: string
          _email: string
          _expires_at: string
          _plan: string
          _user_id: string
        }
        Returns: undefined
      }
      admin_revoke_admin: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_set_user_plan: {
        Args: {
          env?: string
          expires_at?: string
          new_plan: string
          target_user_id: string
        }
        Returns: undefined
      }
      create_server_invite: {
        Args: {
          _email: string
          _role: Database["public"]["Enums"]["server_role"]
          _tenant_id: string
        }
        Returns: string
      }
      default_permissions_for_role: {
        Args: { _role: Database["public"]["Enums"]["server_role"] }
        Returns: Json
      }
      get_my_server_permissions: { Args: { _tenant_id: string }; Returns: Json }
      get_my_tenant_secret: { Args: never; Returns: string }
      get_my_vps_activation_token: {
        Args: never
        Returns: {
          activated_at: string
          activation_token: string
          last_validated_at: string
          license_status: string
          vps_hostname: string
          vps_ip: string
          vps_status: string
        }[]
      }
      get_public_branding: {
        Args: never
        Returns: {
          background_url: string
          favicon_url: string
          footer_link_label: string
          footer_link_url: string
          footer_text: string
          logo_url: string
          primary_color: string
          server_name: string
        }[]
      }
      get_tenant_secret: { Args: { _tenant_id: string }; Returns: string }
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
      has_server_permission: {
        Args: { _permission: string; _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      is_server_member: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      list_server_invites_redacted: {
        Args: { _tenant_id: string }
        Returns: {
          email_masked: string
          expires_at: string
          id: string
          invited_at: string
          invited_by: string
          is_inviter: boolean
          role: Database["public"]["Enums"]["server_role"]
          status: Database["public"]["Enums"]["invite_status"]
          tenant_id: string
        }[]
      }
      log_audit_event: {
        Args: {
          _action: string
          _error?: string
          _http_status?: number
          _metadata?: Json
          _status?: string
          _target?: string
          _tenant_id?: string
        }
        Returns: string
      }
      register_ingame_participation: {
        Args: {
          _event_id: string
          _metadata?: Json
          _role_name?: string
          _roleid: number
          _tenant_id: string
          _userid?: number
        }
        Returns: Json
      }
      set_active_tenant: {
        Args: { target_tenant_id: string }
        Returns: undefined
      }
      start_free_trial: { Args: { _environment: string }; Returns: string }
      suspend_expired_licenses: { Args: never; Returns: undefined }
      validate_license: { Args: { _key: string }; Returns: Json }
      validate_vps_activation: {
        Args: {
          _fingerprint: string
          _hostname?: string
          _ip?: string
          _token: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user" | "superadmin"
      attendance_delivery_status:
        | "pending"
        | "sent"
        | "error"
        | "duplicate_blocked"
      ingame_delivery_status: "pending" | "sent" | "error" | "duplicate_blocked"
      ingame_event_status: "draft" | "active" | "closed"
      ingame_event_type: "ingame_generic"
      ingame_participation_source: "npc" | "manual" | "import"
      ingame_reward_mode: "all_participants" | "raffle_winners"
      invite_status: "pending" | "accepted" | "revoked" | "expired"
      license_status: "active" | "expired" | "revoked" | "suspended"
      server_role: "owner" | "admin" | "editor" | "readonly"
      vps_activation_status: "active" | "revoked" | "suspended"
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
      attendance_delivery_status: [
        "pending",
        "sent",
        "error",
        "duplicate_blocked",
      ],
      ingame_delivery_status: ["pending", "sent", "error", "duplicate_blocked"],
      ingame_event_status: ["draft", "active", "closed"],
      ingame_event_type: ["ingame_generic"],
      ingame_participation_source: ["npc", "manual", "import"],
      ingame_reward_mode: ["all_participants", "raffle_winners"],
      invite_status: ["pending", "accepted", "revoked", "expired"],
      license_status: ["active", "expired", "revoked", "suspended"],
      server_role: ["owner", "admin", "editor", "readonly"],
      vps_activation_status: ["active", "revoked", "suspended"],
    },
  },
} as const
