import { toast } from "sonner";
import { ScormError } from './ScormError';
import { SCORM_ERROR_MESSAGES } from './errorMessages';

export class ScormErrorHandler {
  private lastError: ScormError | null = null;

  setError(errorType: keyof typeof SCORM_ERROR_MESSAGES): string {
    const error = SCORM_ERROR_MESSAGES[errorType];
    this.lastError = new ScormError(error.code, error.message, error.diagnostic);
    console.error(`SCORM Error: [${error.code}] ${error.message} - ${error.diagnostic}`);
    toast.error(error.message);
    return error.code;
  }

  getLastError(): string {
    return this.lastError?.code || '0';
  }

  getErrorString(errorCode: string): string {
    if (!this.lastError || this.lastError.code !== errorCode) {
      return 'No error';
    }
    return this.lastError.message;
  }

  getDiagnostic(errorCode: string): string {
    if (!this.lastError || this.lastError.code !== errorCode) {
      return 'No error';
    }
    return this.lastError.diagnostic;
  }

  clearError(): void {
    this.lastError = null;
  }
}