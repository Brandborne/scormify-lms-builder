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
      audit_logs: {
        Row: {
          action: string
          details: string | null
          id: string
          performed_by: string
          timestamp: string
        }
        Insert: {
          action: string
          details?: string | null
          id?: string
          performed_by: string
          timestamp?: string
        }
        Update: {
          action?: string
          details?: string | null
          id?: string
          performed_by?: string
          timestamp?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          created_by: string
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      course_assignments: {
        Row: {
          access_token: string
          assigned_at: string
          completed_at: string | null
          contact_id: string
          course_id: string
          id: string
          last_position: string | null
          status: Database["public"]["Enums"]["assignment_status"]
        }
        Insert: {
          access_token?: string
          assigned_at?: string
          completed_at?: string | null
          contact_id: string
          course_id: string
          id?: string
          last_position?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
        }
        Update: {
          access_token?: string
          assigned_at?: string
          completed_at?: string | null
          contact_id?: string
          course_id?: string
          id?: string
          last_position?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "course_assignments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          course_files_path: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          manifest_data: Json | null
          original_zip_path: string
          title: string
          updated_at: string
        }
        Insert: {
          course_files_path: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          manifest_data?: Json | null
          original_zip_path: string
          title: string
          updated_at?: string
        }
        Update: {
          course_files_path?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          manifest_data?: Json | null
          original_zip_path?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string
          content: string | null
          created_at: string
          created_by: string
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content?: string | null
          created_at?: string
          created_by: string
          id?: string
          status: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          created_by?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          description: string
          id: string
          reported_at: string
          reported_by: string
          severity: string
          status: string
          title: string
        }
        Insert: {
          description: string
          id?: string
          reported_at?: string
          reported_by: string
          severity: string
          status: string
          title: string
        }
        Update: {
          description?: string
          id?: string
          reported_at?: string
          reported_by?: string
          severity?: string
          status?: string
          title?: string
        }
        Relationships: []
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
      risks: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          impact: string
          likelihood: string
          mitigation_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          id?: string
          impact: string
          likelihood: string
          mitigation_status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          impact?: string
          likelihood?: string
          mitigation_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      scorm_runtime_data: {
        Row: {
          completion_status: string | null
          course_id: string
          created_at: string
          id: string
          location: string | null
          progress: number | null
          score: number | null
          suspend_data: string | null
          total_time: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completion_status?: string | null
          course_id: string
          created_at?: string
          id?: string
          location?: string | null
          progress?: number | null
          score?: number | null
          suspend_data?: string | null
          total_time?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completion_status?: string | null
          course_id?: string
          created_at?: string
          id?: string
          location?: string | null
          progress?: number | null
          score?: number | null
          suspend_data?: string | null
          total_time?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scorm_runtime_data_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
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
      assignment_status: "pending" | "in_progress" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
