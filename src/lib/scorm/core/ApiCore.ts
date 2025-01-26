import { supabase } from "@/integrations/supabase/client";
import { ScormData } from '../types';
import { ScormDataManager } from '../dataManager';
import { ScormErrorHandler } from '../errors/errorHandler';
import { traverseDataModel, updateDataModel } from '../utils';

export class ApiCore {
  private data: ScormData = { cmi: {} };
  private initialized: boolean = false;
  private terminated: boolean = false;
  private startTime: number;
  private userId: string | undefined;
  private errorHandler: ScormErrorHandler;
  private dataManager: ScormDataManager;

  constructor(private courseId: string) {
    this.startTime = Date.now();
    this.errorHandler = new ScormErrorHandler();
    this.dataManager = new ScormDataManager(courseId, this.userId, this.startTime);
  }

  private async initializeUserId(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error('No authenticated user found');
    }
    this.userId = session.user.id;
    this.dataManager = new ScormDataManager(this.courseId, this.userId, this.startTime);
  }

  async initialize(): Promise<string> {
    if (this.initialized) {
      return this.errorHandler.setError('ALREADY_INITIALIZED');
    }

    try {
      await this.initializeUserId();
      
      if (!this.userId) {
        return this.errorHandler.setError('GENERAL_INITIALIZATION_FAILURE');
      }

      const { data: existingData } = await supabase
        .from('scorm_runtime_data')
        .select('*')
        .eq('course_id', this.courseId)
        .eq('user_id', this.userId)
        .maybeSingle();

      this.data = await this.dataManager.loadInitialData(existingData);
      
      this.initialized = true;
      this.errorHandler.clearError();
      return 'true';
    } catch (error) {
      console.error('SCORM initialization error:', error);
      return this.errorHandler.setError('GENERAL_INITIALIZATION_FAILURE');
    }
  }

  terminate(): string {
    if (!this.initialized) {
      return this.errorHandler.setError('NOT_INITIALIZED');
    }

    if (this.terminated) {
      return this.errorHandler.setError('TERMINATED');
    }

    try {
      this.terminated = true;
      this.dataManager.saveData(this.data);
      this.errorHandler.clearError();
      return 'true';
    } catch (error) {
      console.error('SCORM termination error:', error);
      return this.errorHandler.setError('GENERAL_EXCEPTION');
    }
  }

  getValue(element: string): string {
    if (!this.initialized) {
      return this.errorHandler.setError('NOT_INITIALIZED');
    }

    try {
      const value = traverseDataModel(this.data, element);
      if (value === undefined) {
        return this.errorHandler.setError('INVALID_GET_VALUE');
      }
      
      this.errorHandler.clearError();
      return String(value);
    } catch (error) {
      console.error('GetValue error:', error);
      return this.errorHandler.setError('GENERAL_EXCEPTION');
    }
  }

  setValue(element: string, value: string): string {
    if (!this.initialized) {
      return this.errorHandler.setError('NOT_INITIALIZED');
    }

    try {
      const result = updateDataModel(this.data, element, value);
      if (!result.success) {
        return this.errorHandler.setError(result.error === 'TYPE_MISMATCH' ? 'TYPE_MISMATCH' : 'VALUE_OUT_OF_RANGE');
      }
      
      this.errorHandler.clearError();
      return 'true';
    } catch (error) {
      console.error('SetValue error:', error);
      return this.errorHandler.setError('GENERAL_EXCEPTION');
    }
  }

  commit(): string {
    if (!this.initialized) {
      return this.errorHandler.setError('NOT_INITIALIZED');
    }

    try {
      this.dataManager.saveData(this.data);
      this.errorHandler.clearError();
      return 'true';
    } catch (error) {
      console.error('Commit error:', error);
      return this.errorHandler.setError('GENERAL_EXCEPTION');
    }
  }

  getLastError(): string {
    return this.errorHandler.getLastError();
  }

  getErrorString(errorCode: string): string {
    return this.errorHandler.getErrorString(errorCode);
  }

  getDiagnostic(errorCode: string): string {
    return this.errorHandler.getDiagnostic(errorCode);
  }
}