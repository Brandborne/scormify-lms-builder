import { ApiCore } from './core/ApiCore';

class ScormAPI {
  private api: ApiCore;

  constructor(courseId: string) {
    this.api = new ApiCore(courseId);
  }

  async Initialize(param: string = ""): Promise<string> {
    console.log('Initialize called with param:', param);
    return this.api.initialize();
  }

  Terminate(param: string = ""): string {
    console.log('Terminate called with param:', param);
    return this.api.terminate();
  }

  GetValue(element: string): string {
    console.log('GetValue called for element:', element);
    return this.api.getValue(element);
  }

  SetValue(element: string, value: string): string {
    console.log('SetValue called for element:', element, 'with value:', value);
    return this.api.setValue(element, value);
  }

  Commit(param: string = ""): string {
    console.log('Commit called with param:', param);
    return this.api.commit();
  }

  GetLastError(): string {
    return this.api.getLastError();
  }

  GetErrorString(errorCode: string): string {
    return this.api.getErrorString(errorCode);
  }

  GetDiagnostic(errorCode: string): string {
    return this.api.getDiagnostic(errorCode);
  }
}

export default ScormAPI;