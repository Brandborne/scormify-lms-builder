import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import JSZip from 'https://esm.sh/jszip@3.10.1'
import { processZipContent } from './scormProcessor.ts'
import { downloadZipFile } from './fileUtils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
}

serve(async (req) => {
  console.log('Received request:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body?.courseId) {
      console.error('Invalid request: Missing courseId');
      throw new Error('Invalid request: courseId is required');
    }

    const courseId = body.courseId;
    console.log('Processing course:', courseId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing required environment variables');
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      console.error('Error fetching course:', courseError);
      throw new Error('Course not found');
    }

    console.log('Downloading zip file:', course.original_zip_path);
    const zipBuffer = await downloadZipFile(supabase, course.original_zip_path);
    
    console.log('Loading zip content');
    const zip = await JSZip.loadAsync(zipBuffer);
    
    console.log('Processing zip content');
    const { indexHtmlPath, originalIndexPath, manifestData } = await processZipContent(
      zip, 
      supabase, 
      courseId
    );

    // Update course with manifest data and processing status
    const { error: updateError } = await supabase
      .from('courses')
      .update({
        manifest_data: {
          ...manifestData,
          status: 'processed',
          index_path: indexHtmlPath,
          original_index_path: originalIndexPath
        }
      })
      .eq('id', courseId);

    if (updateError) {
      console.error('Error updating course:', updateError);
      throw new Error('Failed to update course manifest data');
    }

    console.log('Successfully processed SCORM package');
    return new Response(
      JSON.stringify({ 
        message: 'SCORM package processed successfully',
        manifestData
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error processing SCORM package:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred while processing the SCORM package'
      }),
      { 
        headers: corsHeaders,
        status: 500
      }
    );
  }
});