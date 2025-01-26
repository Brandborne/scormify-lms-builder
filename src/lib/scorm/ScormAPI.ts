import { supabase } from "@/integrations/supabase/client";

export interface ScormData {
  cmi?: {
    completion_status?: 'completed' | 'incomplete' | 'not attempted' | 'unknown';
    success_status?: 'passed' | 'failed' | 'unknown';
    score?: {
      scaled?: number;
      raw?: number;
      min?: number;
      max?: number;
    };
    progress_measure?: number;
    location?: string;
    suspend_data?: string;
    total_time?: string;
    session_time?: string;
    mode?: 'normal' | 'browse' | 'review';
    entry?: 'ab-initio' | 'resume' | '';
    exit?: 'timeout' | 'suspend' | 'logout' | 'normal' | '';
    credit?: 'credit' | 'no-credit';
    [key: string]: any;
  };
}

class ScormAPI {
  private courseId: string;
  private data: ScormData = { cmi: {} };
  private initialized: boolean = false;
  private terminated: boolean = false;
  private lastError: string = '0';
  private startTime: number;
  private userId: string | undefined;

  // Error codes as per SCORM 2004 specification
  private readonly errorCodes = {
    NO_ERROR: '0',
    GENERAL_EXCEPTION: '101',
    GENERAL_INIT_FAILURE: '102',
    ALREADY_INITIALIZED: '103',
    CONTENT_INSTANCE_TERMINATED: '104',
    GENERAL_GET_FAILURE: '301',
    GENERAL_SET_FAILURE: '351',
    GENERAL_COMMIT_FAILURE: '391',
    UNDEFINED_DATA_MODEL: '401',
    UNIMPLEMENTED_DATA_MODEL: '402',
    DATA_MODEL_ELEMENT_VALUE_NOT_INITIALIZED: '403',
    READ_ONLY_ELEMENT: '404',
    WRITE_ONLY_ELEMENT: '405',
    DATA_MODEL_ELEMENT_TYPE_MISMATCH: '406',
    DATA_MODEL_ELEMENT_VALUE_OUT_OF_RANGE: '407',
    DATA_MODEL_DEPENDENCY_NOT_ESTABLISHED: '408'
  };

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
      this.lastError = this.errorCodes.GENERAL_INIT_FAILURE;
      throw new Error('No authenticated user found');
    }
    this.userId = session.user.id;
  }

  // SCORM API Implementation Methods
  async Initialize(param: string = ""): Promise<string> {
    console.log('Initialize called with param:', param);
    
    if (this.initialized) {
      this.lastError = this.errorCodes.ALREADY_INITIALIZED;
      return 'false';
    }

    try {
      await this.initializeUserId();
      
      if (!this.userId) {
        this.lastError = this.errorCodes.GENERAL_INIT_FAILURE;
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
          completion_status: existingData.completion_status,
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
      this.lastError = this.errorCodes.NO_ERROR;
      return 'true';
    } catch (error) {
      console.error('SCORM initialization error:', error);
      this.lastError = this.errorCodes.GENERAL_INIT_FAILURE;
      return 'false';
    }
  }

  Terminate(param: string = ""): string {
    console.log('Terminate called with param:', param);
    
    if (!this.initialized) {
      this.lastError = this.errorCodes.CONTENT_INSTANCE_TERMINATED;
      return 'false';
    }

    if (this.terminated) {
      this.lastError = this.errorCodes.CONTENT_INSTANCE_TERMINATED;
      return 'false';
    }

    try {
      this.terminated = true;
      this.saveData();
      this.lastError = this.errorCodes.NO_ERROR;
      return 'true';
    } catch (error) {
      console.error('SCORM termination error:', error);
      this.lastError = this.errorCodes.GENERAL_EXCEPTION;
      return 'false';
    }
  }

  GetValue(element: string): string {
    console.log('GetValue called for element:', element);
    
    if (!this.initialized) {
      this.lastError = this.errorCodes.GENERAL_GET_FAILURE;
      return '';
    }

    try {
      const value = this.traverseDataModel(element);
      if (value === undefined) {
        this.lastError = this.errorCodes.UNDEFINED_DATA_MODEL;
        return '';
      }
      
      this.lastError = this.errorCodes.NO_ERROR;
      return String(value);
    } catch (error) {
      console.error('GetValue error:', error);
      this.lastError = this.errorCodes.GENERAL_GET_FAILURE;
      return '';
    }
  }

  SetValue(element: string, value: string): string {
    console.log('SetValue called for element:', element, 'with value:', value);
    
    if (!this.initialized) {
      this.lastError = this.errorCodes.GENERAL_SET_FAILURE;
      return 'false';
    }

    try {
      this.updateDataModel(element, value);
      this.lastError = this.errorCodes.NO_ERROR;
      return 'true';
    } catch (error) {
      console.error('SetValue error:', error);
      this.lastError = this.errorCodes.GENERAL_SET_FAILURE;
      return 'false';
    }
  }

  Commit(param: string = ""): string {
    console.log('Commit called with param:', param);
    
    if (!this.initialized) {
      this.lastError = this.errorCodes.GENERAL_COMMIT_FAILURE;
      return 'false';
    }

    try {
      this.saveData();
      this.lastError = this.errorCodes.NO_ERROR;
      return 'true';
    } catch (error) {
      console.error('Commit error:', error);
      this.lastError = this.errorCodes.GENERAL_COMMIT_FAILURE;
      return 'false';
    }
  }

  GetLastError(): string {
    return this.lastError;
  }

  GetErrorString(errorCode: string): string {
    const errorStrings: { [key: string]: string } = {
      '0': 'No error',
      '101': 'General exception',
      '102': 'General initialization failure',
      '103': 'Already initialized',
      '104': 'Content instance terminated',
      '301': 'General get failure',
      '351': 'General set failure',
      '391': 'General commit failure',
      '401': 'Undefined data model',
      '402': 'Unimplemented data model',
      '403': 'Data model element value not initialized',
      '404': 'Data model element is read only',
      '405': 'Data model element is write only',
      '406': 'Data model element type mismatch',
      '407': 'Data model element value out of range',
      '408': 'Data model dependency not established'
    };

    return errorStrings[errorCode] || 'Unknown error';
  }

  GetDiagnostic(errorCode: string): string {
    // For now, return the same as GetErrorString
    // In a production environment, this would include more detailed diagnostic information
    return this.GetErrorString(errorCode);
  }

  // Helper methods
  private traverseDataModel(path: string): any {
    const parts = path.split('.');
    let current: any = this.data;
    
    for (const part of parts) {
      if (current === undefined) return undefined;
      current = current[part];
    }
    
    return current;
  }

  private updateDataModel(path: string, value: string): void {
    const parts = path.split('.');
    const last = parts.pop()!;
    let current: any = this.data;
    
    for (const part of parts) {
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[last] = value;
  }

  private async saveData(): Promise<void> {
    if (!this.userId) return;

    const totalTime = Math.floor((Date.now() - this.startTime) / 1000);
    
    const { error } = await supabase
      .from('scorm_runtime_data')
      .upsert({
        course_id: this.courseId,
        user_id: this.userId,
        completion_status: this.data.cmi?.completion_status,
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