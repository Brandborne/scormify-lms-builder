export interface IncidentTables {
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