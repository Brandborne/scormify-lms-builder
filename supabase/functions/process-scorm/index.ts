import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Process SCORM function initialized');

function validateManifestXML(xmlString: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    // Parse XML string
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    // Check for XML parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      errors.push('Invalid XML format: ' + parseError.textContent);
      return { isValid: false, errors };
    }

    // Check for required root element
    const manifest = xmlDoc.querySelector('manifest');
    if (!manifest) {
      errors.push('Missing required root element: manifest');
      return { isValid: false, errors };
    }

    // Check for required identifier attribute
    if (!manifest.getAttribute('identifier')) {
      errors.push('Missing required attribute: manifest identifier');
    }

    // Check for required organizations element
    if (!xmlDoc.querySelector('organizations')) {
      errors.push('Missing required element: organizations');
    }

    // Check for required resources element
    if (!xmlDoc.querySelector('resources')) {
      errors.push('Missing required element: resources');
    }

    // Check for metadata (optional but recommended)
    if (!xmlDoc.querySelector('metadata')) {
      console.warn('Warning: metadata element not found');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    console.error('XML validation error:', error);
    errors.push('Failed to validate XML: ' + (error as Error).message);
    return { isValid: false, errors };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId } = await req.json();
    console.log('Processing SCORM package for course:', courseId);

    if (!courseId) {
      throw new Error('Course ID is required');
    }

    // Initialize Supabase client
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
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      console.error('Error fetching course:', courseError);
      return new Response(
        JSON.stringify({
          error: 'Course not found',
          toast: {
            title: 'Error',
            description: 'Course not found in the database',
            type: 'error'
          }
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
          status: 404
        }
      );
    }

    // List files in course directory
    const { data: files, error: listError } = await supabaseClient
      .storage
      .from('scorm_packages')
      .list(course.course_files_path);

    if (listError) {
      console.error('Error listing files:', listError);
      return new Response(
        JSON.stringify({
          error: 'Failed to list course files',
          toast: {
            title: 'Error',
            description: 'Could not access course files',
            type: 'error'
          }
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
          status: 400
        }
      );
    }

    // Find manifest file (ignore macOS system files)
    const manifestFile = files.find(file => 
      !file.name.startsWith('._') && 
      !file.name.startsWith('__MACOSX') && 
      file.name.toLowerCase() === 'imsmanifest.xml'
    );

    if (!manifestFile) {
      console.error('No manifest file found in directory:', course.course_files_path);
      return new Response(
        JSON.stringify({
          error: 'No manifest file found in package',
          toast: {
            title: 'Error',
            description: 'Could not find the SCORM manifest file in the package',
            type: 'error'
          }
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
          status: 400
        }
      );
    }

    console.log('Found manifest file:', manifestFile.name);

    // Download manifest file content
    const { data: manifestData, error: downloadError } = await supabaseClient
      .storage
      .from('scorm_packages')
      .download(`${course.course_files_path}/${manifestFile.name}`);

    if (downloadError || !manifestData) {
      console.error('Error downloading manifest:', downloadError);
      return new Response(
        JSON.stringify({
          error: 'Failed to download manifest file',
          toast: {
            title: 'Error',
            description: 'Could not read the manifest file content',
            type: 'error'
          }
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
          status: 400
        }
      );
    }

    // Convert manifest blob to text
    const manifestText = await manifestData.text();

    // Validate manifest XML
    const validationResult = validateManifestXML(manifestText);
    console.log('Manifest validation result:', validationResult);

    if (!validationResult.isValid) {
      return new Response(
        JSON.stringify({
          error: 'Invalid manifest XML',
          validationErrors: validationResult.errors,
          toast: {
            title: 'Validation Error',
            description: validationResult.errors[0],
            type: 'error'
          }
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
          status: 400
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        manifestPath: `${course.course_files_path}/${manifestFile.name}`,
        toast: {
          title: 'Success',
          description: 'SCORM manifest validated successfully',
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

  } catch (error) {
    console.error('Error processing SCORM package:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        toast: {
          title: 'Error',
          description: error.message || 'An unexpected error occurred',
          type: 'error'
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 400
      }
    );
  }
});