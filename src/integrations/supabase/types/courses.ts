export interface CourseTables {
  Row: {
    created_at: string
    created_by: string
    description: string | null
    id: string
    manifest_data: Json | null
    package_path: string
    title: string
    updated_at: string
  }
  Insert: {
    created_at?: string
    created_by: string
    description?: string | null
    id?: string
    manifest_data?: Json | null
    package_path: string
    title: string
    updated_at?: string
  }
  Update: {
    created_at?: string
    created_by?: string
    description?: string | null
    id?: string
    manifest_data?: Json | null
    package_path?: string
    title?: string
    updated_at?: string
  }
  Relationships: []
}