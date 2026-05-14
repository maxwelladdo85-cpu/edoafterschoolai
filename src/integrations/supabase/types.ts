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
      attempt_answers: {
        Row: {
          attempt_id: string
          id: string
          is_correct: boolean | null
          points_awarded: number
          question_id: string
          selected_choice_id: string | null
          text_answer: string | null
        }
        Insert: {
          attempt_id: string
          id?: string
          is_correct?: boolean | null
          points_awarded?: number
          question_id: string
          selected_choice_id?: string | null
          text_answer?: string | null
        }
        Update: {
          attempt_id?: string
          id?: string
          is_correct?: boolean | null
          points_awarded?: number
          question_id?: string
          selected_choice_id?: string | null
          text_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_selected_choice_id_fkey"
            columns: ["selected_choice_id"]
            isOneToOne: false
            referencedRelation: "question_choices"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          class_level: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          subject: string | null
          teacher_id: string
          teacher_name: string | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          class_level?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          subject?: string | null
          teacher_id: string
          teacher_name?: string | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          class_level?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          subject?: string | null
          teacher_id?: string
          teacher_name?: string | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          learner_id: string
          progress: number
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          learner_id: string
          progress?: number
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          learner_id?: string
          progress?: number
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_completions: {
        Row: {
          completed_at: string
          id: string
          learner_id: string
          lesson_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          learner_id: string
          lesson_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          learner_id?: string
          lesson_id?: string
        }
        Relationships: []
      }
      lesson_views: {
        Row: {
          id: string
          learner_id: string
          lesson_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          learner_id: string
          lesson_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          learner_id?: string
          lesson_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          content_text: string | null
          content_type: Database["public"]["Enums"]["lesson_content_type"]
          content_url: string | null
          created_at: string
          id: string
          module_id: string
          notes: string | null
          position: number
          title: string
        }
        Insert: {
          content_text?: string | null
          content_type?: Database["public"]["Enums"]["lesson_content_type"]
          content_url?: string | null
          created_at?: string
          id?: string
          module_id: string
          notes?: string | null
          position?: number
          title: string
        }
        Update: {
          content_text?: string | null
          content_type?: Database["public"]["Enums"]["lesson_content_type"]
          content_url?: string | null
          created_at?: string
          id?: string
          module_id?: string
          notes?: string | null
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          id: string
          position: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          position?: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          class_level: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          lga: string | null
        }
        Insert: {
          avatar_url?: string | null
          class_level?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          lga?: string | null
        }
        Update: {
          avatar_url?: string | null
          class_level?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          lga?: string | null
        }
        Relationships: []
      }
      question_choices: {
        Row: {
          id: string
          is_correct: boolean
          label: string
          position: number
          question_id: string
        }
        Insert: {
          id?: string
          is_correct?: boolean
          label: string
          position?: number
          question_id: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          label?: string
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_choices_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_short_answer: string | null
          created_at: string
          feedback: string | null
          id: string
          points: number
          position: number
          prompt: string
          quiz_id: string
          type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          correct_short_answer?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          points?: number
          position?: number
          prompt: string
          quiz_id: string
          type: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          correct_short_answer?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          points?: number
          position?: number
          prompt?: string
          quiz_id?: string
          type?: Database["public"]["Enums"]["question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          attempt_number: number
          id: string
          learner_id: string
          max_score: number
          quiz_id: string
          score: number
          started_at: string
          submitted_at: string | null
        }
        Insert: {
          attempt_number?: number
          id?: string
          learner_id: string
          max_score?: number
          quiz_id: string
          score?: number
          started_at?: string
          submitted_at?: string | null
        }
        Update: {
          attempt_number?: number
          id?: string
          learner_id?: string
          max_score?: number
          quiz_id?: string
          score?: number
          started_at?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          time_limit_minutes: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          time_limit_minutes?: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          time_limit_minutes?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_announcements: {
        Row: {
          class_level: string
          created_at: string
          error: string | null
          id: string
          message: string | null
          recipient_count: number
          send_at: string
          sender_id: string
          sent_at: string | null
          status: string
          title: string
        }
        Insert: {
          class_level: string
          created_at?: string
          error?: string | null
          id?: string
          message?: string | null
          recipient_count?: number
          send_at: string
          sender_id: string
          sent_at?: string | null
          status?: string
          title: string
        }
        Update: {
          class_level?: string
          created_at?: string
          error?: string | null
          id?: string
          message?: string | null
          recipient_count?: number
          send_at?: string
          sender_id?: string
          sent_at?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      tutor_messages: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          learner_id: string
          role: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          id?: string
          learner_id: string
          role: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          learner_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_messages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
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
      vark_results: {
        Row: {
          answers: Json
          aural: number
          created_at: string
          dominant: string
          id: string
          kinesthetic: number
          learner_id: string
          read_write: number
          visual: number
        }
        Insert: {
          answers?: Json
          aural?: number
          created_at?: string
          dominant: string
          id?: string
          kinesthetic?: number
          learner_id: string
          read_write?: number
          visual?: number
        }
        Update: {
          answers?: Json
          aural?: number
          created_at?: string
          dominant?: string
          id?: string
          kinesthetic?: number
          learner_id?: string
          read_write?: number
          visual?: number
        }
        Relationships: []
      }
      virtual_class_attendance: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          learner_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          learner_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          learner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtual_class_attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "virtual_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_classes: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          recording_url: string | null
          scheduled_at: string
          teacher_id: string
          title: string
          zoom_url: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          recording_url?: string | null
          scheduled_at: string
          teacher_id: string
          title: string
          zoom_url: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          recording_url?: string | null
          scheduled_at?: string
          teacher_id?: string
          title?: string
          zoom_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      dispatch_due_announcements: { Args: never; Returns: number }
      enroll_class_in_course: {
        Args: { p_class_level: string; p_course_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_learner_classes: {
        Args: never
        Returns: {
          class_level: string
          learner_count: number
        }[]
      }
      schedule_class_announcement: {
        Args: {
          p_class_level: string
          p_message: string
          p_send_at: string
          p_title: string
        }
        Returns: string
      }
      send_class_announcement: {
        Args: { p_class_level: string; p_message: string; p_title: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "learner"
      lesson_content_type: "video" | "pdf" | "audio" | "text" | "doc"
      question_type: "mcq" | "true_false" | "short_answer"
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
      app_role: ["admin", "teacher", "learner"],
      lesson_content_type: ["video", "pdf", "audio", "text", "doc"],
      question_type: ["mcq", "true_false", "short_answer"],
    },
  },
} as const
