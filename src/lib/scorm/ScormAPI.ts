import { ApiCore } from './core/ApiCore';
import { ScormLoggingService } from './services/LoggingService';
import { SCORM_ERROR_DETAILS, ScormErrorCode } from './errors/ScormErrorTypes';

class ScormAPI {
  private api: ApiCore;
  private logger: ScormLoggingService;
  private initialized: boolean = false;

  constructor(courseId: string, debugMode: boolean = false) {
    this.logger = new ScormLoggingService(courseId, debugMode);
    this.api = new ApiCore(courseId, this.logger);
  }

  // SCORM 2004 API Implementation
  async Initialize(param: string = ""): Promise<string> {
    this.logger.apiCall('Initialize', param);
    if (this.initialized) {
      this.logger.error('Already initialized');
      return 'false';
    }
    
    const result = await this.api.initialize();
    if (result === 'true') {
      this.initialized = true;
    }
    return result;
  }

  Terminate(param: string = ""): string {
    this.logger.apiCall('Terminate', param);
    if (!this.initialized) {
      this.logger.error('Not initialized');
      return 'false';
    }
    
    const result = this.api.terminate();
    if (result === 'true') {
      this.initialized = false;
    }
    return result;
  }

  GetValue(element: string): string {
    this.logger.apiCall('GetValue', element);
    if (!this.initialized) {
      this.logger.error('Not initialized');
      return '';
    }
    return this.api.getValue(element);
  }

  SetValue(element: string, value: string): string {
    this.logger.apiCall('SetValue', element, value);
    if (!this.initialized) {
      this.logger.error('Not initialized');
      return 'false';
    }
    return this.api.setValue(element, value);
  }

  Commit(param: string = ""): string {
    this.logger.apiCall('Commit', param);
    if (!this.initialized) {
      this.logger.error('Not initialized');
      return 'false';
    }
    return this.api.commit();
  }

  GetLastError(): string {
    return this.api.getLastError();
  }

  GetErrorString(errorCode: string): string {
    const errorType = Object.entries(SCORM_ERROR_DETAILS).find(
      ([_, details]) => details.code === errorCode
    )?.[0] as ScormErrorCode;

    return errorType 
      ? SCORM_ERROR_DETAILS[errorType].message 
      : 'Unknown error';
  }

  GetDiagnostic(errorCode: string): string {
    const errorType = Object.entries(SCORM_ERROR_DETAILS).find(
      ([_, details]) => details.code === errorCode
    )?.[0] as ScormErrorCode;

    return errorType 
      ? SCORM_ERROR_DETAILS[errorType].diagnostic || SCORM_ERROR_DETAILS[errorType].message
      : 'Unknown error';
  }
}

export default ScormAPI;