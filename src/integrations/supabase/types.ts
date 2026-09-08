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
      documents: {
        Row: {
          address: string | null
          created_at: string
          dob: string | null
          document_id: string
          document_number: string
          document_type: string
          expiry_date: string | null
          gender: string | null
          holder_name: string
          id: string
          issue_date: string | null
          person_id: string
          status: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          dob?: string | null
          document_id: string
          document_number: string
          document_type: string
          expiry_date?: string | null
          gender?: string | null
          holder_name: string
          id?: string
          issue_date?: string | null
          person_id: string
          status?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          dob?: string | null
          document_id?: string
          document_number?: string
          document_type?: string
          expiry_date?: string | null
          gender?: string | null
          holder_name?: string
          id?: string
          issue_date?: string | null
          person_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["person_id"]
          },
        ]
      }
      persons: {
        Row: {
          address: string | null
          created_at: string
          dob: string
          gender: string | null
          id: string
          name: string
          person_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          dob: string
          gender?: string | null
          id?: string
          name: string
          person_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          dob?: string
          gender?: string | null
          id?: string
          name?: string
          person_id?: string
        }
        Relationships: []
      }
      verification_events: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          verification_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          verification_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_events_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verification_records"
            referencedColumns: ["verification_id"]
          },
        ]
      }
      verification_field_results: {
        Row: {
          confidence: number | null
          created_at: string
          database_value: string | null
          extracted_value: string | null
          field_name: string
          id: string
          match_status: string
          verification_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          database_value?: string | null
          extracted_value?: string | null
          field_name: string
          id?: string
          match_status: string
          verification_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          database_value?: string | null
          extracted_value?: string | null
          field_name?: string
          id?: string
          match_status?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_field_results_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verification_records"
            referencedColumns: ["verification_id"]
          },
        ]
      }
      verification_records: {
        Row: {
          address_match: string | null
          citizen_name: string | null
          created_at: string
          cross_documents: Json
          dob_match: string | null
          document_id: string | null
          document_number_match: string | null
          document_type: string
          expiry_valid: string | null
          extracted: Json
          face_match: string
          id: string
          name_match: string | null
          officer_name: string | null
          person_id: string | null
          risk_level: string
          risk_reasons: Json
          risk_score: number
          source_file_name: string | null
          status_match: string | null
          tamper_indicator: string
          verification_id: string
          verification_status: string
        }
        Insert: {
          address_match?: string | null
          citizen_name?: string | null
          created_at?: string
          cross_documents?: Json
          dob_match?: string | null
          document_id?: string | null
          document_number_match?: string | null
          document_type: string
          expiry_valid?: string | null
          extracted?: Json
          face_match?: string
          id?: string
          name_match?: string | null
          officer_name?: string | null
          person_id?: string | null
          risk_level?: string
          risk_reasons?: Json
          risk_score?: number
          source_file_name?: string | null
          status_match?: string | null
          tamper_indicator?: string
          verification_id: string
          verification_status?: string
        }
        Update: {
          address_match?: string | null
          citizen_name?: string | null
          created_at?: string
          cross_documents?: Json
          dob_match?: string | null
          document_id?: string | null
          document_number_match?: string | null
          document_type?: string
          expiry_valid?: string | null
          extracted?: Json
          face_match?: string
          id?: string
          name_match?: string | null
          officer_name?: string | null
          person_id?: string | null
          risk_level?: string
          risk_reasons?: Json
          risk_score?: number
          source_file_name?: string | null
          status_match?: string | null
          tamper_indicator?: string
          verification_id?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_records_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "verification_records_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["person_id"]
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
  public: {
    Enums: {},
  },
} as const
