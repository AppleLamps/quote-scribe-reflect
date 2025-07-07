export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          username?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_vector_ext: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_bookmarked: {
        Args: { article_id: number; user_id: string }
        Returns: boolean
      }
      upsert_repo_metadata: {
        Args: {
          p_repo_url: string
          p_repo_name: string
          p_file_count: number
          p_file_hashes: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
