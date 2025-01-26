import { supabase } from "@/integrations/supabase/client";

export interface ScormData {
  completionStatus?: string;
  progress?: number;
  score?: number;
  totalTime?: number;
  suspendData?: string;
  location?: string;
}

class ScormAPI {
  private courseId: string;
  private data: ScormData = {};
  private startTime: number;

  constructor(courseId: string) {
    this.courseId = courseId;
    this.startTime = Date.now();
  }

  async initialize(): Promise<boolean> {
    try {
      const { data: existingData } = await supabase
        .from('scorm_runtime_data')
        .select('*')
        .eq('course_id', this.courseId)
        .maybeSingle();

      if (existingData) {
        this.data = {
          completionStatus: existingData.completion_status,
          progress: existingData.progress,
          score: existingData.score,
          totalTime: existingData.total_time,
          suspendData: existingData.suspend_data,
          location: existingData.location,
        };
      } else {
        const { error } = await supabase
          .from('scorm_runtime_data')
          .insert({
            course_id: this.courseId,
            completion_status: 'not attempted',
            progress: 0,
          });

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('SCORM initialization error:', error);
      return false;
    }
  }

  async setValue(key: keyof ScormData, value: any): Promise<boolean> {
    try {
      this.data[key] = value;
      
      const { error } = await supabase
        .from('scorm_runtime_data')
        .upsert({
          course_id: this.courseId,
          [this.toSnakeCase(key)]: value,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('SCORM setValue error:', error);
      return false;
    }
  }

  getValue(key: keyof ScormData): any {
    return this.data[key];
  }

  async terminate(): Promise<boolean> {
    try {
      const totalTime = Math.floor((Date.now() - this.startTime) / 1000);
      
      const { error } = await supabase
        .from('scorm_runtime_data')
        .update({ total_time: totalTime })
        .eq('course_id', this.courseId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('SCORM termination error:', error);
      return false;
    }
  }

  private toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  }
}

export default ScormAPI;