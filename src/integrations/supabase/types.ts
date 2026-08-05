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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      chapter_progress: {
        Row: {
          chapter_id: string
          completed_at: string | null
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_progress_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          created_at: string
          description: string | null
          id: string
          sort_order: number
          subject_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          subject_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          subject_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          answers: Json | null
          chapter_title: string
          created_at: string
          due_date: string
          id: string
          questions: Json
          report: Json | null
          score: number | null
          session_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          chapter_title: string
          created_at?: string
          due_date?: string
          id?: string
          questions?: Json
          report?: Json | null
          score?: number | null
          session_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          chapter_title?: string
          created_at?: string
          due_date?: string
          id?: string
          questions?: Json
          report?: Json | null
          score?: number | null
          session_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "lesson_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          code: string
          is_active: boolean
          name: string
          native_name: string
          sort_order: number
        }
        Insert: {
          code: string
          is_active?: boolean
          name: string
          native_name: string
          sort_order?: number
        }
        Update: {
          code?: string
          is_active?: boolean
          name?: string
          native_name?: string
          sort_order?: number
        }
        Relationships: []
      }
      learning_preferences: {
        Row: {
          board: string
          created_at: string
          daily_minutes: number
          learning_speed: string
          medium: string
          onboarded: boolean
          updated_at: string
          user_id: string
          voice_language: string
        }
        Insert: {
          board?: string
          created_at?: string
          daily_minutes?: number
          learning_speed?: string
          medium?: string
          onboarded?: boolean
          updated_at?: string
          user_id: string
          voice_language?: string
        }
        Update: {
          board?: string
          created_at?: string
          daily_minutes?: number
          learning_speed?: string
          medium?: string
          onboarded?: boolean
          updated_at?: string
          user_id?: string
          voice_language?: string
        }
        Relationships: []
      }
      lesson_sessions: {
        Row: {
          chapter_id: string | null
          chapter_title: string
          completed: boolean
          created_at: string
          current_step: number
          id: string
          language: string
          lesson: Json
          quiz_score: number | null
          session_date: string
          subject_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          chapter_title: string
          completed?: boolean
          created_at?: string
          current_step?: number
          id?: string
          language?: string
          lesson?: Json
          quiz_score?: number | null
          session_date?: string
          subject_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          chapter_title?: string
          completed?: boolean
          created_at?: string
          current_step?: number
          id?: string
          language?: string
          lesson?: Json
          quiz_score?: number | null
          session_date?: string
          subject_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_sessions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_student_links: {
        Row: {
          approved: boolean
          created_at: string
          parent_id: string
          relation: string
          student_id: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          parent_id: string
          relation?: string
          student_id: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          parent_id?: string
          relation?: string
          student_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          education_type: Database["public"]["Enums"]["education_type"]
          full_name: string
          grade_number: number | null
          id: string
          inter_year: Database["public"]["Enums"]["inter_year"] | null
          onboarding_complete: boolean
          phone: string | null
          preferred_language: string
          stream: Database["public"]["Enums"]["stream_code"] | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          education_type?: Database["public"]["Enums"]["education_type"]
          full_name: string
          grade_number?: number | null
          id: string
          inter_year?: Database["public"]["Enums"]["inter_year"] | null
          onboarding_complete?: boolean
          phone?: string | null
          preferred_language?: string
          stream?: Database["public"]["Enums"]["stream_code"] | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          education_type?: Database["public"]["Enums"]["education_type"]
          full_name?: string
          grade_number?: number | null
          id?: string
          inter_year?: Database["public"]["Enums"]["inter_year"] | null
          onboarding_complete?: boolean
          phone?: string | null
          preferred_language?: string
          stream?: Database["public"]["Enums"]["stream_code"] | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_preferred_language_fkey"
            columns: ["preferred_language"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      student_settings: {
        Row: {
          created_at: string
          daily_goal_minutes: number
          notifications_enabled: boolean
          profile_visibility: string
          reminder_time: string
          theme: string
          updated_at: string
          user_id: string
          voice_enabled: boolean
        }
        Insert: {
          created_at?: string
          daily_goal_minutes?: number
          notifications_enabled?: boolean
          profile_visibility?: string
          reminder_time?: string
          theme?: string
          updated_at?: string
          user_id: string
          voice_enabled?: boolean
        }
        Update: {
          created_at?: string
          daily_goal_minutes?: number
          notifications_enabled?: boolean
          profile_visibility?: string
          reminder_time?: string
          theme?: string
          updated_at?: string
          user_id?: string
          voice_enabled?: boolean
        }
        Relationships: []
      }
      study_attendance: {
        Row: {
          created_at: string
          id: string
          minutes: number
          study_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          minutes?: number
          study_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          minutes?: number
          study_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          education_type: Database["public"]["Enums"]["education_type"]
          grade_number: number | null
          icon: string | null
          id: string
          name: string
          sort_order: number
          stream: Database["public"]["Enums"]["stream_code"] | null
        }
        Insert: {
          code: string
          created_at?: string
          education_type: Database["public"]["Enums"]["education_type"]
          grade_number?: number | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
          stream?: Database["public"]["Enums"]["stream_code"] | null
        }
        Update: {
          code?: string
          created_at?: string
          education_type?: Database["public"]["Enums"]["education_type"]
          grade_number?: number | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
          stream?: Database["public"]["Enums"]["stream_code"] | null
        }
        Relationships: []
      }
      topics: {
        Row: {
          chapter_id: string
          created_at: string
          difficulty: number
          estimated_minutes: number
          id: string
          sort_order: number
          summary: string | null
          title: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          difficulty?: number
          estimated_minutes?: number
          id?: string
          sort_order?: number
          summary?: string | null
          title: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          difficulty?: number
          estimated_minutes?: number
          id?: string
          sort_order?: number
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_linked_parent: {
        Args: { _parent: string; _student: string }
        Returns: boolean
      }
      is_username_available: { Args: { _username: string }; Returns: boolean }
    }
    Enums: {
      app_role: "student" | "parent" | "admin"
      education_type: "school" | "intermediate"
      inter_year: "first" | "second"
      stream_code: "MPC" | "BiPC" | "MEC" | "CEC" | "HEC"
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
      app_role: ["student", "parent", "admin"],
      education_type: ["school", "intermediate"],
      inter_year: ["first", "second"],
      stream_code: ["MPC", "BiPC", "MEC", "CEC", "HEC"],
    },
  },
} as const
