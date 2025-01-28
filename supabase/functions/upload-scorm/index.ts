import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import JSZip from 'https://esm.sh/jszip@3.10.1'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Upload SCORM function started');

serve(async (req) => {
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
    console.log('Processing upload request');
    const { courseId, fileData } = await req.json();
    
    if (!courseId || !fileData) {
      throw new Error('Course ID and file data are required');
    }

    console.log('Initializing Supabase client');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false
        }
      }
    );

    // Get course data
    console.log('Fetching course data for:', courseId);
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      console.error('Error fetching course:', courseError);
      throw new Error('Course not found');
    }

    // Load zip content
    console.log('Loading zip content');
    const zipContent = await JSZip.loadAsync(fileData, { base64: true });
    console.log('Zip content loaded successfully');

    // Find the root folder name (if any)
    const paths = Object.keys(zipContent.files);
    const rootFolder = paths.length > 0 ? paths[0].split('/')[0] : '';
    console.log('Root folder detected:', rootFolder);

    // Process each file in the zip
    for (const [relativePath, file] of Object.entries(zipContent.files)) {
      // Skip directories and macOS system files
      if (file.dir || relativePath.startsWith('__MACOSX/')) {
        continue;
      }

      try {
        const content = await file.async('arraybuffer');
        
        // Remove the root folder from the path if it exists
        const finalPath = rootFolder 
          ? relativePath.replace(`${rootFolder}/`, '')
          : relativePath;
        
        const filePath = `${course.course_files_path}/${finalPath}`;
        console.log('Uploading file:', filePath);

        const { error: uploadError } = await supabaseClient
          .storage
          .from('scorm_packages')
          .upload(filePath, content, {
            contentType: 'application/octet-stream',
            upsert: true
          });

        if (uploadError) {
          console.error('Error uploading file:', filePath, uploadError);
          throw uploadError;
        }
      } catch (error) {
        console.error('Error processing file:', relativePath, error);
        throw error;
      }
    }

    // Update course status to uploaded
    console.log('Updating course status');
    const { error: updateError } = await supabaseClient
      .from('courses')
      .update({ processing_stage: 'uploaded' })
      .eq('id', courseId);

    if (updateError) {
      console.error('Error updating course status:', updateError);
      throw updateError;
    }

    console.log('Successfully uploaded and extracted SCORM package');

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        } 
      }
    );

  } catch (error) {
    console.error('Error in upload-scorm function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        stack: error.stack
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