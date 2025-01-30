import { corsHeaders } from '../../_shared/cors.ts';

export function createErrorResponse(error: Error | unknown, status = 400) {
  console.error('Error:', error);
  return new Response(
    JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      toast: {
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        type: 'error'
      }
    }),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status
    }
  );
}

export function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify({ 
      success: true,
      ...data,
      toast: {
        title: 'Success',
        description: 'SCORM manifest processed successfully',
        type: 'success'
      }
    }),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      } 
    }
  );
}

export function logDebug(message: string, data?: any) {
  console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}