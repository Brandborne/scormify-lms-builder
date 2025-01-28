export class ScormError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ScormError';
  }
}

export function handleError(error: unknown): never {
  if (error instanceof ScormError) {
    console.error(`[${error.code}] ${error.message}`, error.details);
    throw error;
  }

  if (error instanceof Error) {
    console.error('Unexpected error:', error.message);
    throw new ScormError(
      error.message,
      'UNEXPECTED_ERROR',
      { originalError: error }
    );
  }

  console.error('Unknown error:', error);
  throw new ScormError(
    'An unknown error occurred',
    'UNKNOWN_ERROR',
    { originalError: error }
  );
}