import { supabase } from "@/integrations/supabase/client";
import { ScormData } from './types';
import { traverseDataModel, updateDataModel } from './utils';
import { ScormDataManager } from './dataManager';
import { ScormError } from './errors/ScormError';
import { SCORM_ERROR_MESSAGES } from './errors/errorMessages';
import { toast } from "sonner";

class ScormAPI {
  private data: ScormData = { cmi: {} };
  private initialized: boolean = false;
  private terminated: boolean = false;
  private startTime: number;
  private userId: string | undefined;
  private courseId: string;
  private dataManager: ScormDataManager;
  private lastError: ScormError | null = null;

  constructor(courseId: string) {
    this.courseId = courseId;
    this.startTime = Date.now();
    this.dataManager = new ScormDataManager(courseId, this.userId, this.startTime);
  }

  private setError(errorType: keyof typeof SCORM_ERROR_MESSAGES) {
    const error = SCORM_ERROR_MESSAGES[errorType];
    this.lastError = new ScormError(error.code, error.message, error.diagnostic);
    console.error(`SCORM Error: [${error.code}] ${error.message} - ${error.diagnostic}`);
    toast.error(error.message);
    return error.code;
  }

  private async initializeUserId(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new ScormError(
        SCORM_ERROR_MESSAGES.GENERAL_INITIALIZATION_FAILURE.code,
        'No authenticated user found',
        'User session not found'
      );
    }
    this.userId = session.user.id;
    this.dataManager = new ScormDataManager(this.courseId, this.userId, this.startTime);
  }

  async Initialize(param: string = ""): Promise<string> {
    console.log('Initialize called with param:', param);
    
    if (this.initialized) {
      return this.setError('ALREADY_INITIALIZED');
    }

    try {
      await this.initializeUserId();
      
      if (!this.userId) {
        return this.setError('GENERAL_INITIALIZATION_FAILURE');
      }

      const { data: existingData } = await supabase
        .from('scorm_runtime_data')
        .select('*')
        .eq('course_id', this.courseId)
        .eq('user_id', this.userId)
        .maybeSingle();

      this.data = await this.dataManager.loadInitialData(existingData);
      
      this.initialized = true;
      this.lastError = null;
      return 'true';
    } catch (error) {
      console.error('SCORM initialization error:', error);
      return this.setError('GENERAL_INITIALIZATION_FAILURE');
    }
  }

  Terminate(param: string = ""): string {
    console.log('Terminate called with param:', param);
    
    if (!this.initialized) {
      return this.setError('NOT_INITIALIZED');
    }

    if (this.terminated) {
      return this.setError('TERMINATED');
    }

    try {
      this.terminated = true;
      this.dataManager.saveData(this.data);
      this.lastError = null;
      return 'true';
    } catch (error) {
      console.error('SCORM termination error:', error);
      return this.setError('GENERAL_EXCEPTION');
    }
  }

  GetValue(element: string): string {
    console.log('GetValue called for element:', element);
    
    if (!this.initialized) {
      return this.setError('NOT_INITIALIZED');
    }

    try {
      const value = traverseDataModel(this.data, element);
      if (value === undefined) {
        return this.setError('INVALID_GET_VALUE');
      }
      
      this.lastError = null;
      return String(value);
    } catch (error) {
      console.error('GetValue error:', error);
      return this.setError('GENERAL_EXCEPTION');
    }
  }

  SetValue(element: string, value: string): string {
    console.log('SetValue called for element:', element, 'with value:', value);
    
    if (!this.initialized) {
      return this.setError('NOT_INITIALIZED');
    }

    try {
      const result = updateDataModel(this.data, element, value);
      if (!result.success) {
        return this.setError(result.error === 'TYPE_MISMATCH' ? 'TYPE_MISMATCH' : 'VALUE_OUT_OF_RANGE');
      }
      
      this.lastError = null;
      return 'true';
    } catch (error) {
      console.error('SetValue error:', error);
      return this.setError('GENERAL_EXCEPTION');
    }
  }

  Commit(param: string = ""): string {
    console.log('Commit called with param:', param);
    
    if (!this.initialized) {
      return this.setError('NOT_INITIALIZED');
    }

    try {
      this.dataManager.saveData(this.data);
      this.lastError = null;
      return 'true';
    } catch (error) {
      console.error('Commit error:', error);
      return this.setError('GENERAL_EXCEPTION');
    }
  }

  GetLastError(): string {
    return this.lastError?.code || '0';
  }

  GetErrorString(errorCode: string): string {
    if (!this.lastError || this.lastError.code !== errorCode) {
      return 'No error';
    }
    return this.lastError.message;
  }

  GetDiagnostic(errorCode: string): string {
    if (!this.lastError || this.lastError.code !== errorCode) {
      return 'No error';
    }
    return this.lastError.diagnostic;
  }
}

export default ScormAPI;