import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { parseManifest } from './manifestParser.ts'

console.log('Process SCORM function started');

serve(async (req) => {
  console.log('Received request:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    });
  }

  try {
    // Parse request body
    const { courseId } = await req.json();
    console.log('Processing SCORM package for course:', courseId);

    if (!courseId) {
      throw new Error('Course ID is required');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch course data
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      console.error('Error fetching course:', courseError);
      throw new Error('Course not found');
    }

    console.log('Course data:', course);

    // First, let's try to get the DTD file
    const { data: dtdData, error: dtdError } = await supabaseClient
      .storage
      .from('scorm_packages')
      .download(`${course.course_files_path}/XMLSchema.dtd`);

    if (dtdError) {
      console.error('Error downloading DTD:', dtdError);
      // Don't throw, continue with manifest processing
    } else {
      // Log the DTD content for examination
      const dtdContent = await dtdData.text();
      console.log('DTD Content:', dtdContent);
    }

    // List files in course directory
    console.log('Listing files in:', course.course_files_path);
    const { data: files, error: listError } = await supabaseClient
      .storage
      .from('scorm_packages')
      .list(course.course_files_path);

    if (listError) {
      console.error('Error listing files:', listError);
      throw listError;
    }

    console.log('Files found:', files);

    // Find manifest file
    const manifestFile = files.find(file => 
      file.name.toLowerCase() === 'imsmanifest.xml'
    );

    if (!manifestFile) {
      console.error('No manifest file found in directory:', course.course_files_path);
      throw new Error('No manifest file found in package');
    }

    console.log('Found manifest file:', manifestFile.name);

    // Download and parse manifest
    const manifestPath = `${course.course_files_path}/${manifestFile.name}`;
    console.log('Downloading manifest from:', manifestPath);
    
    const { data: manifestData, error: downloadError } = await supabaseClient
      .storage
      .from('scorm_packages')
      .download(manifestPath);

    if (downloadError) {
      console.error('Error downloading manifest:', downloadError);
      throw downloadError;
    }

    const manifestContent = await manifestData.text();
    console.log('Manifest Content:', manifestContent);
    
    const manifestInfo = await parseManifest(manifestContent);
    console.log('Parsed Manifest Info:', manifestInfo);

    // Update course with processed manifest data
    const { error: updateError } = await supabaseClient
      .from('courses')
      .update({
        manifest_data: manifestInfo,
        processing_stage: 'processed'
      })
      .eq('id', courseId);

    if (updateError) {
      console.error('Error updating course:', updateError);
      throw updateError;
    }

    console.log('Successfully processed SCORM package');

    return new Response(
      JSON.stringify({ success: true, manifestInfo }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        } 
      }
    );

  } catch (error) {
    console.error('Error processing SCORM package:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        } 
      }
    );
  }
});