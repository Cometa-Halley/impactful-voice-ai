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
      feedback: {
        Row: {
          clarity_score: number | null
          coherence_score: number | null
          created_at: string
          cta_strength: number | null
          energy_score: number | null
          hook_score: number | null
          id: string
          suggestions: string | null
          video_id: string
        }
        Insert: {
          clarity_score?: number | null
          coherence_score?: number | null
          created_at?: string
          cta_strength?: number | null
          energy_score?: number | null
          hook_score?: number | null
          id?: string
          suggestions?: string | null
          video_id: string
        }
        Update: {
          clarity_score?: number | null
          coherence_score?: number | null
          created_at?: string
          cta_strength?: number | null
          energy_score?: number | null
          hook_score?: number | null
          id?: string
          suggestions?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          confidence_level: number | null
          created_at: string
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          full_name: string | null
          id: string
          sector: string | null
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          confidence_level?: number | null
          created_at?: string
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          full_name?: string | null
          id: string
          sector?: string | null
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          confidence_level?: number | null
          created_at?: string
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          full_name?: string | null
          id?: string
          sector?: string | null
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scripts: {
        Row: {
          call_to_action: string | null
          created_at: string
          development: string | null
          duration: Database["public"]["Enums"]["script_duration"] | null
          format: Database["public"]["Enums"]["script_format"] | null
          hook: string | null
          id: string
          methodology: string | null
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          call_to_action?: string | null
          created_at?: string
          development?: string | null
          duration?: Database["public"]["Enums"]["script_duration"] | null
          format?: Database["public"]["Enums"]["script_format"] | null
          hook?: string | null
          id?: string
          methodology?: string | null
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          call_to_action?: string | null
          created_at?: string
          development?: string | null
          duration?: Database["public"]["Enums"]["script_duration"] | null
          format?: Database["public"]["Enums"]["script_format"] | null
          hook?: string | null
          id?: string
          methodology?: string | null
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scripts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          current_step: number | null
          id: string
          methodology: string | null
          script_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_step?: number | null
          id?: string
          methodology?: string | null
          script_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_step?: number | null
          id?: string
          methodology?: string | null
          script_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          methodology: string | null
          recommended_duration:
            | Database["public"]["Enums"]["script_duration"]
            | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          methodology?: string | null
          recommended_duration?:
            | Database["public"]["Enums"]["script_duration"]
            | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          methodology?: string | null
          recommended_duration?:
            | Database["public"]["Enums"]["script_duration"]
            | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          analysis_score: number | null
          created_at: string
          file_url: string | null
          id: string
          script_id: string | null
          user_id: string
        }
        Insert: {
          analysis_score?: number | null
          created_at?: string
          file_url?: string | null
          id?: string
          script_id?: string | null
          user_id: string
        }
        Update: {
          analysis_score?: number | null
          created_at?: string
          file_url?: string | null
          id?: string
          script_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      experience_level: "beginner" | "intermediate" | "advanced"
      script_duration: "30s" | "60s"
      script_format: "vertical" | "horizontal"
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
      experience_level: ["beginner", "intermediate", "advanced"],
      script_duration: ["30s", "60s"],
      script_format: ["vertical", "horizontal"],
    },
  },
} as const
