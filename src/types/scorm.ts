export interface ScormRuntimeData {
  id: string;
  course_id: string;
  user_id: string;
  completion_status?: string;
  progress?: number;
  score?: number;
  total_time?: number;
  suspend_data?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}