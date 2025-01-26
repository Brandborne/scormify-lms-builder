import { ApiCore } from './core/ApiCore';
import { ScormLoggingService } from './services/LoggingService';
import { SCORM_ERROR_DETAILS, ScormErrorCode } from './errors/ScormErrorTypes';

class ScormAPI {
  private api: ApiCore;
  private logger: ScormLoggingService;

  constructor(courseId: string, debugMode: boolean = false) {
    this.logger = new ScormLoggingService(courseId, debugMode);
    this.api = new ApiCore(courseId, this.logger);
  }

  async Initialize(param: string = ""): Promise<string> {
    this.logger.apiCall('Initialize', param);
    return this.api.initialize();
  }

  Terminate(param: string = ""): string {
    this.logger.apiCall('Terminate', param);
    return this.api.terminate();
  }

  GetValue(element: string): string {
    this.logger.apiCall('GetValue', element);
    return this.api.getValue(element);
  }

  SetValue(element: string, value: string): string {
    this.logger.apiCall('SetValue', element, value);
    return this.api.setValue(element, value);
  }

  Commit(param: string = ""): string {
    this.logger.apiCall('Commit', param);
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