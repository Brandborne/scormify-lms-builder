import { supabase } from "@/integrations/supabase/client";
import { SCORM_ERROR_CODES, ERROR_MESSAGES } from './constants';
import { ScormData, CompletionStatus } from './types';
import { validateCompletionStatus, traverseDataModel, updateDataModel } from './utils';

class ScormAPI {
  private courseId: string;
  private data: ScormData = { cmi: {} };
  private initialized: boolean = false;
  private terminated: boolean = false;
  private lastError: string = SCORM_ERROR_CODES.NO_ERROR;
  private startTime: number;
  private userId: string | undefined;

  constructor(courseId: string) {
    this.courseId = courseId;
    this.startTime = Date.now();
    this.data.cmi = {
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

  private async initializeUserId() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      this.lastError = SCORM_ERROR_CODES.GENERAL_INIT_FAILURE;
      throw new Error('No authenticated user found');
    }
    this.userId = session.user.id;
  }

  async Initialize(param: string = ""): Promise<string> {
    console.log('Initialize called with param:', param);
    
    if (this.initialized) {
      this.lastError = SCORM_ERROR_CODES.ALREADY_INITIALIZED;
      return 'false';
    }

    try {
      await this.initializeUserId();
      
      if (!this.userId) {
        this.lastError = SCORM_ERROR_CODES.GENERAL_INIT_FAILURE;
        return 'false';
      }

      const { data: existingData } = await supabase
        .from('scorm_runtime_data')
        .select('*')
        .eq('course_id', this.courseId)
        .eq('user_id', this.userId)
        .maybeSingle();

      if (existingData) {
        this.data.cmi = {
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
        const { error } = await supabase
          .from('scorm_runtime_data')
          .insert({
            course_id: this.courseId,
            user_id: this.userId,
            completion_status: 'not attempted',
            progress: 0
          });

        if (error) throw error;
      }

      this.initialized = true;
      this.lastError = SCORM_ERROR_CODES.NO_ERROR;
      return 'true';
    } catch (error) {
      console.error('SCORM initialization error:', error);
      this.lastError = SCORM_ERROR_CODES.GENERAL_INIT_FAILURE;
      return 'false';
    }
  }

  Terminate(param: string = ""): string {
    console.log('Terminate called with param:', param);
    
    if (!this.initialized || this.terminated) {
      this.lastError = SCORM_ERROR_CODES.CONTENT_INSTANCE_TERMINATED;
      return 'false';
    }

    try {
      this.terminated = true;
      this.saveData();
      this.lastError = SCORM_ERROR_CODES.NO_ERROR;
      return 'true';
    } catch (error) {
      console.error('SCORM termination error:', error);
      this.lastError = SCORM_ERROR_CODES.GENERAL_EXCEPTION;
      return 'false';
    }
  }

  GetValue(element: string): string {
    console.log('GetValue called for element:', element);
    
    if (!this.initialized) {
      this.lastError = SCORM_ERROR_CODES.GENERAL_GET_FAILURE;
      return '';
    }

    try {
      const value = traverseDataModel(this.data, element);
      if (value === undefined) {
        this.lastError = SCORM_ERROR_CODES.UNDEFINED_DATA_MODEL;
        return '';
      }
      
      this.lastError = SCORM_ERROR_CODES.NO_ERROR;
      return String(value);
    } catch (error) {
      console.error('GetValue error:', error);
      this.lastError = SCORM_ERROR_CODES.GENERAL_GET_FAILURE;
      return '';
    }
  }

  SetValue(element: string, value: string): string {
    console.log('SetValue called for element:', element, 'with value:', value);
    
    if (!this.initialized) {
      this.lastError = SCORM_ERROR_CODES.GENERAL_SET_FAILURE;
      return 'false';
    }

    try {
      updateDataModel(this.data, element, value);
      this.lastError = SCORM_ERROR_CODES.NO_ERROR;
      return 'true';
    } catch (error) {
      console.error('SetValue error:', error);
      this.lastError = SCORM_ERROR_CODES.GENERAL_SET_FAILURE;
      return 'false';
    }
  }

  Commit(param: string = ""): string {
    console.log('Commit called with param:', param);
    
    if (!this.initialized) {
      this.lastError = SCORM_ERROR_CODES.GENERAL_COMMIT_FAILURE;
      return 'false';
    }

    try {
      this.saveData();
      this.lastError = SCORM_ERROR_CODES.NO_ERROR;
      return 'true';
    } catch (error) {
      console.error('Commit error:', error);
      this.lastError = SCORM_ERROR_CODES.GENERAL_COMMIT_FAILURE;
      return 'false';
    }
  }

  GetLastError(): string {
    return this.lastError;
  }

  GetErrorString(errorCode: string): string {
    return ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES] || 'Unknown error';
  }

  GetDiagnostic(errorCode: string): string {
    return this.GetErrorString(errorCode);
  }

  private async saveData(): Promise<void> {
    if (!this.userId) return;

    const totalTime = Math.floor((Date.now() - this.startTime) / 1000);
    
    const { error } = await supabase
      .from('scorm_runtime_data')
      .upsert({
        course_id: this.courseId,
        user_id: this.userId,
        completion_status: validateCompletionStatus(this.data.cmi?.completion_status || 'unknown'),
        progress: this.data.cmi?.progress_measure,
        score: this.data.cmi?.score?.scaled,
        total_time: totalTime,
        suspend_data: this.data.cmi?.suspend_data,
        location: this.data.cmi?.location
      });

    if (error) throw error;
  }
}

export default ScormAPI;