import { toast } from "sonner";

export class ScormLoggingService {
  private courseId: string;
  private debugMode: boolean;

  constructor(courseId: string, debugMode: boolean = false) {
    this.courseId = courseId;
    this.debugMode = debugMode;
  }

  info(message: string, data?: any) {
    if (this.debugMode) {
      console.log(`[SCORM][${this.courseId}] ${message}`, data || '');
    }
  }

  error(message: string, error?: any) {
    console.error(`[SCORM][${this.courseId}] ${message}`, error || '');
    toast.error(`SCORM Error: ${message}`);
  }

  warn(message: string, data?: any) {
    console.warn(`[SCORM][${this.courseId}] ${message}`, data || '');
  }

  debug(message: string, data?: any) {
    if (this.debugMode) {
      console.debug(`[SCORM][${this.courseId}] ${message}`, data || '');
    }
  }

  apiCall(method: string, ...args: any[]) {
    if (this.debugMode) {
      console.log(`[SCORM][${this.courseId}] API Call: ${method}`, ...args);
    }
  }
}