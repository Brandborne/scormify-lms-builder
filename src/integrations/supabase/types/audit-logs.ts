export interface AuditLogTables {
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