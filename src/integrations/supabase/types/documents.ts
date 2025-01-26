export interface DocumentTables {
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