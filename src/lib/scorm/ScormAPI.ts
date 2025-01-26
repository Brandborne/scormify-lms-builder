import { supabase } from "@/integrations/supabase/client";
import { SCORM_ERROR_CODES } from './constants';
import { ScormData } from './types';
import { traverseDataModel, updateDataModel } from './utils';
import { ScormDataManager } from './dataManager';
import { ScormErrorHandler } from './errorHandler';

class ScormAPI {
  private data: ScormData = { cmi: {} };
  private initialized: boolean = false;
  private terminated: boolean = false;
  private startTime: number;
  private userId: string | undefined;
  private courseId: string;
  private dataManager: ScormDataManager;
  private errorHandler: ScormErrorHandler;

  constructor(courseId: string) {
    this.courseId = courseId;
    this.startTime = Date.now();
    this.errorHandler = new ScormErrorHandler();
    this.dataManager = new ScormDataManager(courseId, this.userId, this.startTime);
  }

  private async initializeUserId(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      this.errorHandler.setError(SCORM_ERROR_CODES.GENERAL_INIT_FAILURE);
      throw new Error('No authenticated user found');
    }
    this.userId = session.user.id;
    this.dataManager = new ScormDataManager(this.courseId, this.userId, this.startTime);
  }

  async Initialize(param: string = ""): Promise<string> {
    console.log('Initialize called with param:', param);
    
    if (this.initialized) {
      this.errorHandler.setError(SCORM_ERROR_CODES.ALREADY_INITIALIZED);
      return 'false';
    }

    try {
      await this.initializeUserId();
      
      if (!this.userId) {
        this.errorHandler.setError(SCORM_ERROR_CODES.GENERAL_INIT_FAILURE);
        return 'false';
      }

      const { data: existingData } = await supabase
        .from('scorm_runtime_data')
        .select('*')
        .eq('course_id', this.courseId)
        .eq('user_id', this.userId)
        .maybeSingle();

      this.data = await this.dataManager.loadInitialData(existingData);
      
      this.initialized = true;
      this.errorHandler.setError(SCORM_ERROR_CODES.NO_ERROR);
      return 'true';
    } catch (error) {
      console.error('SCORM initialization error:', error);
      this.errorHandler.setError(SCORM_ERROR_CODES.GENERAL_INIT_FAILURE);
      return 'false';
    }
  }

  Terminate(param: string = ""): string {
    console.log('Terminate called with param:', param);
    
    if (!this.initialized || this.terminated) {
      this.errorHandler.setError(SCORM_ERROR_CODES.CONTENT_INSTANCE_TERMINATED);
      return 'false';
    }

    try {
      this.terminated = true;
      this.dataManager.saveData(this.data);
      this.errorHandler.setError(SCORM_ERROR_CODES.NO_ERROR);
      return 'true';
    } catch (error) {
      console.error('SCORM termination error:', error);
      this.errorHandler.setError(SCORM_ERROR_CODES.GENERAL_EXCEPTION);
      return 'false';
    }
  }

  GetValue(element: string): string {
    console.log('GetValue called for element:', element);
    
    if (!this.initialized) {
      this.errorHandler.setError(SCORM_ERROR_CODES.GENERAL_GET_FAILURE);
      return '';
    }

    try {
      const value = traverseDataModel(this.data, element);
      if (value === undefined) {
        this.errorHandler.setError(SCORM_ERROR_CODES.UNDEFINED_DATA_MODEL);
        return '';
      }
      
      this.errorHandler.setError(SCORM_ERROR_CODES.NO_ERROR);
      return String(value);
    } catch (error) {
      console.error('GetValue error:', error);
      this.errorHandler.setError(SCORM_ERROR_CODES.GENERAL_GET_FAILURE);
      return '';
    }
  }

  SetValue(element: string, value: string): string {
    console.log('SetValue called for element:', element, 'with value:', value);
    
    if (!this.initialized) {
      this.errorHandler.setError(SCORM_ERROR_CODES.GENERAL_SET_FAILURE);
      return 'false';
    }

    try {
      updateDataModel(this.data, element, value);
      this.errorHandler.setError(SCORM_ERROR_CODES.NO_ERROR);
      return 'true';
    } catch (error) {
      console.error('SetValue error:', error);
      this.errorHandler.setError(SCORM_ERROR_CODES.GENERAL_SET_FAILURE);
      return 'false';
    }
  }

  Commit(param: string = ""): string {
    console.log('Commit called with param:', param);
    
    if (!this.initialized) {
      this.errorHandler.setError(SCORM_ERROR_CODES.GENERAL_COMMIT_FAILURE);
      return 'false';
    }

    try {
      this.dataManager.saveData(this.data);
      this.errorHandler.setError(SCORM_ERROR_CODES.NO_ERROR);
      return 'true';
    } catch (error) {
      console.error('Commit error:', error);
      this.errorHandler.setError(SCORM_ERROR_CODES.GENERAL_COMMIT_FAILURE);
      return 'false';
    }
  }

  GetLastError(): string {
    return this.errorHandler.getLastError();
  }

  GetErrorString(errorCode: string): string {
    return this.errorHandler.getErrorString(errorCode);
  }

  GetDiagnostic(errorCode: string): string {
    return this.errorHandler.getDiagnostic(errorCode);
  }
}

export default ScormAPI;