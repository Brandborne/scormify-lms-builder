export class ScormError extends Error {
  code: string;
  diagnostic: string;

  constructor(code: string, message: string, diagnostic: string = '') {
    super(message);
    this.name = 'ScormError';
    this.code = code;
    this.diagnostic = diagnostic;
  }
}