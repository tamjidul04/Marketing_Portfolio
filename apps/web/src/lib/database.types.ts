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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      about_facts: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_visible: boolean
          label: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          is_visible?: boolean
          label: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_visible?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          logo_path: string | null
          name: string
          sort_order: number
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          logo_path?: string | null
          name: string
          sort_order?: number
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          logo_path?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      case_studies: {
        Row: {
          card_color: string
          challenge: string
          channels: string[]
          client_name: string | null
          cover_path: string | null
          created_at: string
          duration_text: string | null
          id: string
          industry: string | null
          is_featured: boolean
          kpi_label: string | null
          kpi_value: string | null
          metrics: Json
          published_at: string | null
          results: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["publish_status"]
          strategy: string
          summary: string
          title: string
          updated_at: string
          visual_data: Json
          visual_type: Database["public"]["Enums"]["case_visual"]
        }
        Insert: {
          card_color?: string
          challenge?: string
          channels?: string[]
          client_name?: string | null
          cover_path?: string | null
          created_at?: string
          duration_text?: string | null
          id?: string
          industry?: string | null
          is_featured?: boolean
          kpi_label?: string | null
          kpi_value?: string | null
          metrics?: Json
          published_at?: string | null
          results?: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["publish_status"]
          strategy?: string
          summary?: string
          title: string
          updated_at?: string
          visual_data?: Json
          visual_type?: Database["public"]["Enums"]["case_visual"]
        }
        Update: {
          card_color?: string
          challenge?: string
          channels?: string[]
          client_name?: string | null
          cover_path?: string | null
          created_at?: string
          duration_text?: string | null
          id?: string
          industry?: string | null
          is_featured?: boolean
          kpi_label?: string | null
          kpi_value?: string | null
          metrics?: Json
          published_at?: string | null
          results?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["publish_status"]
          strategy?: string
          summary?: string
          title?: string
          updated_at?: string
          visual_data?: Json
          visual_type?: Database["public"]["Enums"]["case_visual"]
        }
        Relationships: []
      }
      case_study_images: {
        Row: {
          alt: string
          caption: string | null
          case_study_id: string
          created_at: string
          id: string
          image_path: string
          sort_order: number
        }
        Insert: {
          alt?: string
          caption?: string | null
          case_study_id: string
          created_at?: string
          id?: string
          image_path: string
          sort_order?: number
        }
        Update: {
          alt?: string
          caption?: string | null
          case_study_id?: string
          created_at?: string
          id?: string
          image_path?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "case_study_images_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "case_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          badge_color: string
          badge_text: string
          created_at: string
          id: string
          image_path: string | null
          is_visible: boolean
          issued_on: string | null
          issuer: string | null
          name: string
          sort_order: number
          updated_at: string
          verify_url: string | null
        }
        Insert: {
          badge_color?: string
          badge_text?: string
          created_at?: string
          id?: string
          image_path?: string | null
          is_visible?: boolean
          issued_on?: string | null
          issuer?: string | null
          name: string
          sort_order?: number
          updated_at?: string
          verify_url?: string | null
        }
        Update: {
          badge_color?: string
          badge_text?: string
          created_at?: string
          id?: string
          image_path?: string | null
          is_visible?: boolean
          issued_on?: string | null
          issuer?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
          verify_url?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          admin_note: string | null
          budget: string | null
          business: string | null
          created_at: string
          email: string | null
          id: string
          ip_hash: string | null
          message: string
          name: string
          phone: string | null
          service: string | null
          source_path: string | null
          status: Database["public"]["Enums"]["message_status"]
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          budget?: string | null
          business?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip_hash?: string | null
          message?: string
          name: string
          phone?: string | null
          service?: string | null
          source_path?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          budget?: string | null
          business?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip_hash?: string | null
          message?: string
          name?: string
          phone?: string | null
          service?: string | null
          source_path?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_visible: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_visible?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      process_steps: {
        Row: {
          created_at: string
          description: string
          id: string
          is_visible: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_visible?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_visible?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profile: {
        Row: {
          about_body: string
          about_quote: string | null
          about_title: string
          availability_text: string
          full_name: string
          headline: string
          headline_accent: string | null
          hero_intro: string
          hero_tags: string[]
          id: number
          initials: string
          is_available: boolean
          location: string | null
          photo_alt: string | null
          photo_path: string | null
          role_title: string
          short_name: string
          trust_text: string | null
          updated_at: string
        }
        Insert: {
          about_body?: string
          about_quote?: string | null
          about_title?: string
          availability_text?: string
          full_name?: string
          headline?: string
          headline_accent?: string | null
          hero_intro?: string
          hero_tags?: string[]
          id?: number
          initials?: string
          is_available?: boolean
          location?: string | null
          photo_alt?: string | null
          photo_path?: string | null
          role_title?: string
          short_name?: string
          trust_text?: string | null
          updated_at?: string
        }
        Update: {
          about_body?: string
          about_quote?: string | null
          about_title?: string
          availability_text?: string
          full_name?: string
          headline?: string
          headline_accent?: string | null
          hero_intro?: string
          hero_tags?: string[]
          id?: number
          initials?: string
          is_available?: boolean
          location?: string | null
          photo_alt?: string | null
          photo_path?: string | null
          role_title?: string
          short_name?: string
          trust_text?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string
          features: string[]
          icon: string
          id: string
          is_visible: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          features?: string[]
          icon?: string
          id?: string
          is_visible?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          features?: string[]
          icon?: string
          id?: string
          is_visible?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          budget_options: string[]
          color_accent: string
          color_highlight: string
          color_primary: string
          contact_email: string | null
          footer_text: string | null
          ga4_id: string | null
          id: number
          meta_pixel_id: string | null
          og_image_path: string | null
          phone: string | null
          response_time_text: string
          seo_description: string | null
          seo_title: string | null
          show_brands: boolean
          show_faq: boolean
          show_process: boolean
          show_results: boolean
          show_tools: boolean
          socials: Json
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          budget_options?: string[]
          color_accent?: string
          color_highlight?: string
          color_primary?: string
          contact_email?: string | null
          footer_text?: string | null
          ga4_id?: string | null
          id?: number
          meta_pixel_id?: string | null
          og_image_path?: string | null
          phone?: string | null
          response_time_text?: string
          seo_description?: string | null
          seo_title?: string | null
          show_brands?: boolean
          show_faq?: boolean
          show_process?: boolean
          show_results?: boolean
          show_tools?: boolean
          socials?: Json
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          budget_options?: string[]
          color_accent?: string
          color_highlight?: string
          color_primary?: string
          contact_email?: string | null
          footer_text?: string | null
          ga4_id?: string | null
          id?: number
          meta_pixel_id?: string | null
          og_image_path?: string | null
          phone?: string | null
          response_time_text?: string
          seo_description?: string | null
          seo_title?: string | null
          show_brands?: boolean
          show_faq?: boolean
          show_process?: boolean
          show_results?: boolean
          show_tools?: boolean
          socials?: Json
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      stats: {
        Row: {
          created_at: string
          decimals: number
          id: string
          is_visible: boolean
          label: string
          prefix: string
          show_in_hero: boolean
          sort_order: number
          suffix: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          decimals?: number
          id?: string
          is_visible?: boolean
          label: string
          prefix?: string
          show_in_hero?: boolean
          sort_order?: number
          suffix?: string
          updated_at?: string
          value: number
        }
        Update: {
          created_at?: string
          decimals?: number
          id?: string
          is_visible?: boolean
          label?: string
          prefix?: string
          show_in_hero?: boolean
          sort_order?: number
          suffix?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_name: string
          author_role: string | null
          avatar_color: string
          avatar_path: string | null
          case_study_id: string | null
          company: string | null
          created_at: string
          id: string
          is_visible: boolean
          quote: string
          rating: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          author_name: string
          author_role?: string | null
          avatar_color?: string
          avatar_path?: string | null
          case_study_id?: string | null
          company?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          quote: string
          rating?: number | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_role?: string | null
          avatar_color?: string
          avatar_path?: string | null
          case_study_id?: string | null
          company?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          quote?: string
          rating?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "case_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          color: string
          created_at: string
          icon_path: string | null
          id: string
          is_visible: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon_path?: string | null
          id?: string
          is_visible?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          icon_path?: string | null
          id?: string
          is_visible?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      submit_contact_message: {
        Args: {
          p_budget?: string
          p_business?: string
          p_email?: string
          p_ip_hash?: string
          p_message?: string
          p_name: string
          p_phone?: string
          p_service?: string
          p_source_path?: string
        }
        Returns: string
      }
    }
    Enums: {
      case_visual: "bars" | "line" | "ranking" | "ad" | "image"
      message_status: "new" | "read" | "replied" | "archived" | "spam"
      publish_status: "draft" | "published"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      case_visual: ["bars", "line", "ranking", "ad", "image"],
      message_status: ["new", "read", "replied", "archived", "spam"],
      publish_status: ["draft", "published"],
    },
  },
} as const
