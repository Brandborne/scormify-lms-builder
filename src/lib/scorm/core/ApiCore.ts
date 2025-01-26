import { supabase } from "@/integrations/supabase/client";
import { ScormData } from '../types';
import { ScormDataManager } from '../dataManager';
import { ScormLoggingService } from '../services/LoggingService';
import { SCORM_ERROR_DETAILS, ScormErrorCode } from '../errors/ScormErrorTypes';
import { traverseDataModel, updateDataModel } from '../utils';

export class ApiCore {
  private data: ScormData = { cmi: {} };
  private initialized: boolean = false;
  private terminated: boolean = false;
  private startTime: number;
  private userId: string | undefined;
  private lastError: ScormErrorCode = 'NO_ERROR';
  private dataManager: ScormDataManager;
  private logger: ScormLoggingService;

  constructor(private courseId: string, logger: ScormLoggingService) {
    this.startTime = Date.now();
    this.logger = logger;
    this.dataManager = new ScormDataManager(courseId, this.userId, this.startTime, this.logger);
  }

  private async initializeUserId(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error('No authenticated user found');
    }
    this.userId = session.user.id;
    this.dataManager = new ScormDataManager(this.courseId, this.userId, this.startTime, this.logger);
  }

  private setError(errorType: ScormErrorCode): string {
    this.lastError = errorType;
    const details = SCORM_ERROR_DETAILS[errorType];
    this.logger.error(details.message, details.diagnostic);
    return details.code;
  }

  async initialize(): Promise<string> {
    if (this.initialized) {
      return this.setError('ALREADY_INITIALIZED');
    }

    try {
      await this.initializeUserId();
      
      if (!this.userId) {
        return this.setError('GENERAL_INIT_FAILURE');
      }

      const { data: existingData } = await supabase
        .from('scorm_runtime_data')
        .select('*')
        .eq('course_id', this.courseId)
        .eq('user_id', this.userId)
        .maybeSingle();

      this.data = await this.dataManager.loadInitialData(existingData);
      
      this.initialized = true;
      this.lastError = 'NO_ERROR';
      this.logger.info('SCORM API initialized successfully');
      return 'true';
    } catch (error) {
      this.logger.error('Failed to initialize SCORM API', error);
      return this.setError('GENERAL_INIT_FAILURE');
    }
  }

  terminate(): string {
    if (!this.initialized) {
      return this.setError('GENERAL_EXCEPTION');
    }

    if (this.terminated) {
      return this.setError('CONTENT_INSTANCE_TERMINATED');
    }

    try {
      this.terminated = true;
      this.dataManager.saveData(this.data);
      this.lastError = 'NO_ERROR';
      this.logger.info('SCORM API terminated successfully');
      return 'true';
    } catch (error) {
      this.logger.error('Failed to terminate SCORM API', error);
      return this.setError('GENERAL_EXCEPTION');
    }
  }

  getValue(element: string): string {
    if (!this.initialized) {
      return this.setError('GENERAL_GET_FAILURE');
    }

    try {
      const value = traverseDataModel(this.data, element);
      if (value === undefined) {
        return this.setError('UNDEFINED_DATA_MODEL');
      }
      
      this.lastError = 'NO_ERROR';
      this.logger.debug(`GetValue: ${element} = ${value}`);
      return String(value);
    } catch (error) {
      this.logger.error(`Failed to get value for ${element}`, error);
      return this.setError('GENERAL_GET_FAILURE');
    }
  }

  setValue(element: string, value: string): string {
    if (!this.initialized) {
      return this.setError('GENERAL_SET_FAILURE');
    }

    try {
      const result = updateDataModel(this.data, element, value);
      if (!result.success) {
        return this.setError(result.error === 'TYPE_MISMATCH' 
          ? 'DATA_MODEL_ELEMENT_TYPE_MISMATCH' 
          : 'DATA_MODEL_ELEMENT_VALUE_OUT_OF_RANGE'
        );
      }
      
      this.lastError = 'NO_ERROR';
      this.logger.debug(`SetValue: ${element} = ${value}`);
      return 'true';
    } catch (error) {
      this.logger.error(`Failed to set value for ${element}`, error);
      return this.setError('GENERAL_SET_FAILURE');
    }
  }

  commit(): string {
    if (!this.initialized) {
      return this.setError('GENERAL_COMMIT_FAILURE');
    }

    try {
      this.dataManager.saveData(this.data);
      this.lastError = 'NO_ERROR';
      this.logger.info('Data committed successfully');
      return 'true';
    } catch (error) {
      this.logger.error('Failed to commit data', error);
      return this.setError('GENERAL_COMMIT_FAILURE');
    }
  }

  getLastError(): string {
    return SCORM_ERROR_DETAILS[this.lastError].code;
  }

  getErrorString(errorCode: string): string {
    const errorType = Object.entries(SCORM_ERROR_DETAILS).find(
      ([_, details]) => details.code === errorCode
    )?.[0] as ScormErrorCode;

    return errorType 
      ? SCORM_ERROR_DETAILS[errorType].message 
      : 'Unknown error';
  }

  getDiagnostic(errorCode: string): string {
    const errorType = Object.entries(SCORM_ERROR_DETAILS).find(
      ([_, details]) => details.code === errorCode
    )?.[0] as ScormErrorCode;

    return errorType 
      ? SCORM_ERROR_DETAILS[errorType].diagnostic || SCORM_ERROR_DETAILS[errorType].message
      : 'Unknown error';
  }
}