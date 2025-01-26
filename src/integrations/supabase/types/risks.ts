export interface RiskTables {
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