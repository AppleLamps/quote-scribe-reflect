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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string | null
          encrypted_key: string
          id: string
          provider: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          encrypted_key: string
          id?: string
          provider: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          encrypted_key?: string
          id?: string
          provider?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          author: string
          category: string
          content: Json
          created_at: string
          excerpt: string
          id: number
          title: string
          user_id: string | null
        }
        Insert: {
          author: string
          category: string
          content: Json
          created_at?: string
          excerpt: string
          id?: number
          title: string
          user_id?: string | null
        }
        Update: {
          author?: string
          category?: string
          content?: Json
          created_at?: string
          excerpt?: string
          id?: number
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          article_id: number
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          article_id: number
          created_at?: string
          id?: number
          user_id: string
        }
        Update: {
          article_id?: number
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string | null
          id: string
          model: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          model?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          model?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      custom_gpts: {
        Row: {
          capabilities: Json | null
          created_at: string | null
          description: string | null
          id: string
          instructions: string | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          capabilities?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          instructions?: string | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          capabilities?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          instructions?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      images: {
        Row: {
          aspect_ratio: string
          created_at: string
          id: string
          is_public: boolean
          prompt: string
          url: string
          user_id: string
        }
        Insert: {
          aspect_ratio: string
          created_at?: string
          id?: string
          is_public?: boolean
          prompt: string
          url: string
          user_id: string
        }
        Update: {
          aspect_ratio?: string
          created_at?: string
          id?: string
          is_public?: boolean
          prompt?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_files: {
        Row: {
          content: string
          created_at: string | null
          custom_gpt_id: string
          id: string
          name: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string | null
          custom_gpt_id: string
          id?: string
          name: string
          type: string
        }
        Update: {
          content?: string
          created_at?: string | null
          custom_gpt_id?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_files_custom_gpt_id_fkey"
            columns: ["custom_gpt_id"]
            isOneToOne: false
            referencedRelation: "custom_gpts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      notebook_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          id: number
          title: string
        }
        Insert: {
          id?: never
          title: string
        }
        Update: {
          id?: never
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          subscription_tier: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          subscription_tier?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          subscription_tier?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          content: string
          created_at: string
          id: string
          source_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          source_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          source_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          default_model: string
          enable_html_sandbox: boolean | null
          id: string
          tts_instructions: string | null
          tts_voice: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_model?: string
          enable_html_sandbox?: boolean | null
          id?: string
          tts_instructions?: string | null
          tts_voice?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_model?: string
          enable_html_sandbox?: boolean | null
          id?: string
          tts_instructions?: string | null
          tts_voice?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transcription_jobs: {
        Row: {
          created_at: string
          duration_seconds: number | null
          enable_speaker_detection: boolean | null
          enhanced_transcript_text: string | null
          enhancement_completed_at: string | null
          enhancement_error_message: string | null
          enhancement_status: string | null
          error_message: string | null
          file_path: string
          file_size_bytes: number
          file_type: Database["public"]["Enums"]["file_type"]
          id: string
          language: string | null
          original_filename: string
          processing_completed_at: string | null
          processing_started_at: string | null
          speaker_count: number | null
          speaker_labels: Json | null
          status: Database["public"]["Enums"]["transcription_status"]
          title: string
          transcript_file_path: string | null
          transcript_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          enable_speaker_detection?: boolean | null
          enhanced_transcript_text?: string | null
          enhancement_completed_at?: string | null
          enhancement_error_message?: string | null
          enhancement_status?: string | null
          error_message?: string | null
          file_path: string
          file_size_bytes: number
          file_type: Database["public"]["Enums"]["file_type"]
          id?: string
          language?: string | null
          original_filename: string
          processing_completed_at?: string | null
          processing_started_at?: string | null
          speaker_count?: number | null
          speaker_labels?: Json | null
          status?: Database["public"]["Enums"]["transcription_status"]
          title: string
          transcript_file_path?: string | null
          transcript_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          enable_speaker_detection?: boolean | null
          enhanced_transcript_text?: string | null
          enhancement_completed_at?: string | null
          enhancement_error_message?: string | null
          enhancement_status?: string | null
          error_message?: string | null
          file_path?: string
          file_size_bytes?: number
          file_type?: Database["public"]["Enums"]["file_type"]
          id?: string
          language?: string | null
          original_filename?: string
          processing_completed_at?: string | null
          processing_started_at?: string | null
          speaker_count?: number | null
          speaker_labels?: Json | null
          status?: Database["public"]["Enums"]["transcription_status"]
          title?: string
          transcript_file_path?: string | null
          transcript_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          auto_download: boolean | null
          created_at: string
          default_language: string | null
          email_notifications: boolean | null
          id: string
          max_file_size_mb: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_download?: boolean | null
          created_at?: string
          default_language?: string | null
          email_notifications?: boolean | null
          id?: string
          max_file_size_mb?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_download?: boolean | null
          created_at?: string
          default_language?: string | null
          email_notifications?: boolean | null
          id?: string
          max_file_size_mb?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_downloads: {
        Row: {
          created_at: string
          download_qualities: Json | null
          error_message: string | null
          id: string
          status: string
          thumbnail_url: string | null
          twitter_url: string
          updated_at: string
          user_id: string | null
          video_author: string | null
          video_duration: string | null
          video_title: string | null
        }
        Insert: {
          created_at?: string
          download_qualities?: Json | null
          error_message?: string | null
          id?: string
          status?: string
          thumbnail_url?: string | null
          twitter_url: string
          updated_at?: string
          user_id?: string | null
          video_author?: string | null
          video_duration?: string | null
          video_title?: string | null
        }
        Update: {
          created_at?: string
          download_qualities?: Json | null
          error_message?: string | null
          id?: string
          status?: string
          thumbnail_url?: string | null
          twitter_url?: string
          updated_at?: string
          user_id?: string | null
          video_author?: string | null
          video_duration?: string | null
          video_title?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_vector_ext: { Args: never; Returns: boolean }
      debug_current_user: {
        Args: never
        Returns: {
          auth_users_count: number
          current_user_email: string
          current_user_id: string
          users_table_count: number
        }[]
      }
      is_bookmarked: {
        Args: { article_id: number; user_id: string }
        Returns: boolean
      }
      upsert_repo_metadata: {
        Args: {
          p_file_count: number
          p_file_hashes: Json
          p_repo_name: string
          p_repo_url: string
        }
        Returns: undefined
      }
    }
    Enums: {
      file_type: "audio" | "video"
      transcription_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
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
      file_type: ["audio", "video"],
      transcription_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
    },
  },
} as const
