import { supabase } from "@/integrations/supabase/client";
import { ScormData } from './types';
import { validateCompletionStatus } from './validation';
import { ScormLoggingService } from './services/LoggingService';

export class ScormDataManager {
  constructor(
    private courseId: string,
    private userId: string | undefined,
    private startTime: number,
    private logger: ScormLoggingService
  ) {}

  async loadInitialData(existingData: any): Promise<ScormData> {
    const data: ScormData = { cmi: {} };
    
    if (existingData) {
      this.logger.info('Loading existing runtime data', existingData);
      data.cmi = {
        completion_status: validateCompletionStatus(existingData.completion_status || 'unknown'),
        progress_measure: existingData.progress,
        score: {
          scaled: existingData.score,
          raw: existingData.score ? existingData.score * 100 : 0
        },
        suspend_data: existingData.suspend_data,
        location: existingData.location,
        total_time: existingData.total_time?.toString()
      };
    } else {
      this.logger.info('Creating initial runtime data');
      await this.createInitialRecord();
      data.cmi = {
        completion_status: 'not attempted',
        success_status: 'unknown',
        score: {
          scaled: 0,
          raw: 0,
          min: 0,
          max: 100
        },
        progress_measure: 0,
        mode: 'normal',
        credit: 'credit',
        entry: 'ab-initio'
      };
    }
    
    return data;
  }

  private async createInitialRecord(): Promise<void> {
    if (!this.userId) {
      this.logger.error('Cannot create initial record: No user ID');
      return;
    }
    
    const { error } = await supabase
      .from('scorm_runtime_data')
      .insert({
        course_id: this.courseId,
        user_id: this.userId,
        completion_status: 'not attempted',
        progress: 0
      });

    if (error) {
      this.logger.error('Failed to create initial runtime record', error);
      throw error;
    }
  }

  async saveData(data: ScormData): Promise<void> {
    if (!this.userId) {
      this.logger.error('Cannot save data: No user ID');
      return;
    }

    const totalTime = Math.floor((Date.now() - this.startTime) / 1000);
    
    const { error } = await supabase
      .from('scorm_runtime_data')
      .upsert({
        course_id: this.courseId,
        user_id: this.userId,
        completion_status: validateCompletionStatus(data.cmi?.completion_status || 'unknown'),
        progress: data.cmi?.progress_measure,
        score: data.cmi?.score?.scaled,
        total_time: totalTime,
        suspend_data: data.cmi?.suspend_data,
        location: data.cmi?.location
      });

    if (error) {
      this.logger.error('Failed to save runtime data', error);
      throw error;
    }

    this.logger.info('Runtime data saved successfully');
  }
}