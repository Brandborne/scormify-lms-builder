import { corsHeaders } from '../../_shared/cors.ts';
import { logError } from './logger.ts';

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

export function handleError(error: unknown): Response {
  if (error instanceof ScormError) {
    logError(`[${error.code}] ${error.message}`, error.details);
    return new Response(
      JSON.stringify({
        error: error.message,
        code: error.code,
        details: error.details
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  logError('Unexpected error:', error);
  return new Response(
    JSON.stringify({
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    }),
    {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}