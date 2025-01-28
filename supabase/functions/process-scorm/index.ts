import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';
import { parseManifest } from './parsers/manifest/index.ts';
import { logInfo, logError } from './utils/logger.ts';
import { handleError, ScormError } from './utils/errorHandler.ts';

console.log('Process SCORM function started');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    logInfo('Handling CORS preflight request');
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    logInfo('Processing SCORM request');
    const { courseId } = await req.json();

    if (!courseId) {
      throw new ScormError('Course ID is required', 'INVALID_REQUEST');
    }

    // Initialize Supabase client
    logInfo('Initializing Supabase client');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );

    // Fetch course data
    logInfo('Fetching course data for:', courseId);
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      logError('Error fetching course:', courseError);
      throw new ScormError('Course not found', 'NOT_FOUND');
    }

    // List files in course directory
    logInfo('Listing files in:', course.course_files_path);
    const { data: files, error: listError } = await supabaseClient
      .storage
      .from('scorm_packages')
      .list(course.course_files_path);

    if (listError) {
      logError('Error listing files:', listError);
      throw listError;
    }

    // Find manifest file (ignore macOS system files)
    const manifestFile = files.find(file => 
      !file.name.startsWith('._') && 
      !file.name.startsWith('__MACOSX') && 
      file.name.toLowerCase() === 'imsmanifest.xml'
    );

    if (!manifestFile) {
      logError('No manifest file found in directory:', course.course_files_path);
      throw new ScormError('No manifest file found in package', 'MANIFEST_NOT_FOUND');
    }

    logInfo('Found manifest file:', manifestFile.name);

    // Download manifest
    const manifestPath = `${course.course_files_path}/${manifestFile.name}`;
    logInfo('Downloading manifest from:', manifestPath);
    
    const { data: manifestData, error: downloadError } = await supabaseClient
      .storage
      .from('scorm_packages')
      .download(manifestPath);

    if (downloadError) {
      logError('Error downloading manifest:', downloadError);
      throw downloadError;
    }

    const manifestContent = await manifestData.text();
    logInfo('Successfully downloaded manifest content');

    // Parse the manifest
    const manifestInfo = parseManifest(manifestContent);
    logInfo('Successfully parsed manifest:', manifestInfo);

    // Update course with processed manifest data
    logInfo('Updating course with manifest data');
    const { error: updateError } = await supabaseClient
      .from('courses')
      .update({
        manifest_data: manifestInfo,
        processing_stage: 'processed'
      })
      .eq('id', courseId);

    if (updateError) {
      logError('Error updating course:', updateError);
      throw updateError;
    }

    logInfo('Successfully processed SCORM package');

    return new Response(
      JSON.stringify({ 
        success: true, 
        manifestInfo 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        } 
      }
    );

  } catch (error) {
    return handleError(error);
  }
});