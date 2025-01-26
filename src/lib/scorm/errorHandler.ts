import { SCORM_ERROR_CODES, ERROR_MESSAGES } from './constants';

export class ScormErrorHandler {
  private lastError: string = SCORM_ERROR_CODES.NO_ERROR;

  setError(code: string): void {
    this.lastError = code;
  }

  getLastError(): string {
    return this.lastError;
  }

  getErrorString(errorCode: string): string {
    return ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES] || 'Unknown error';
  }

  getDiagnostic(errorCode: string): string {
    return this.getErrorString(errorCode);
  }
}