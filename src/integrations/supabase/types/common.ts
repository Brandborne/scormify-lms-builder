import type { AuditLogTables } from './audit-logs'
import type { CourseTables } from './courses'
import type { DocumentTables } from './documents'
import type { IncidentTables } from './incidents'
import type { ProfileTables } from './profiles'
import type { RiskTables } from './risks'

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
      audit_logs: AuditLogTables
      courses: CourseTables
      documents: DocumentTables
      incidents: IncidentTables
      profiles: ProfileTables
      risks: RiskTables
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