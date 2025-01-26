import { supabase } from "@/integrations/supabase/client";

export interface ScormData {
  completionStatus?: string;
  progress?: number;
  score?: number;
  totalTime?: number;
  suspendData?: string;
  location?: string;
  [key: string]: string | number | undefined;  // Index signature to allow dynamic property access
}

class ScormAPI {
  private courseId: string;
  private data: ScormData = {};
  private startTime: number;
  private userId: string | undefined;

  constructor(courseId: string) {
    this.courseId = courseId;
    this.startTime = Date.now();
    this.initializeUserId();
  }

  private async initializeUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    this.userId = user?.id;
  }

  async initialize(): Promise<boolean> {
    try {
      if (!this.userId) {
        console.error('No user ID found');
        return false;
      }

      const { data: existingData } = await supabase
        .from('scorm_runtime_data')
        .select('*')
        .eq('course_id', this.courseId)
        .eq('user_id', this.userId)
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
            user_id: this.userId,
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

  async setValue(key: keyof ScormData, value: string | number): Promise<boolean> {
    try {
      if (!this.userId) {
        console.error('No user ID found');
        return false;
      }

      this.data[key] = value;
      
      const snakeCaseKey = typeof key === 'string' ? this.toSnakeCase(key) : key;
      
      const { error } = await supabase
        .from('scorm_runtime_data')
        .upsert({
          course_id: this.courseId,
          user_id: this.userId,
          [snakeCaseKey]: value,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('SCORM setValue error:', error);
      return false;
    }
  }

  getValue(key: keyof ScormData): string | number | undefined {
    return this.data[key];
  }

  async terminate(): Promise<boolean> {
    try {
      if (!this.userId) {
        console.error('No user ID found');
        return false;
      }

      const totalTime = Math.floor((Date.now() - this.startTime) / 1000);
      
      const { error } = await supabase
        .from('scorm_runtime_data')
        .update({ 
          total_time: totalTime,
          user_id: this.userId 
        })
        .eq('course_id', this.courseId)
        .eq('user_id', this.userId);

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