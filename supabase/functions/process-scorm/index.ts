import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';
import { XMLParser } from 'npm:fast-xml-parser';
import { parseManifestData } from './parsers/manifestParser.ts';

console.log('Process SCORM function initialized');

function validateManifestXML(xmlString: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });

    // Parse XML string
    const result = parser.parse(xmlString);
    console.log('Parsed XML:', JSON.stringify(result, null, 2));

    // Check for manifest element
    if (!result.manifest) {
      errors.push('Missing required root element: manifest');
      return { isValid: false, errors };
    }

    // Check for required identifier attribute
    if (!result.manifest['@_identifier']) {
      errors.push('Missing required attribute: manifest identifier');
    }

    // Check for required organizations element
    if (!result.manifest.organizations) {
      errors.push('Missing required element: organizations');
    }

    // Check for required resources element
    if (!result.manifest.resources) {
      errors.push('Missing required element: resources');
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId } = await req.json();
    console.log('Processing SCORM package for course:', courseId);

    if (!courseId) {
      throw new Error('Course ID is required');
    }

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

    const manifestText = await manifestData.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });

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

    // Parse manifest data
    const result = parser.parse(manifestText);
    console.log('Raw parsed XML:', JSON.stringify(result, null, 2));

    const manifestInfo = parseManifestData(result);
    console.log('Processed manifest data:', JSON.stringify(manifestInfo, null, 2));

    // Update course with manifest data
    const { error: updateError } = await supabaseClient
      .from('courses')
      .update({
        manifest_data: manifestInfo
      })
      .eq('id', courseId);

    if (updateError) {
      console.error('Error updating course:', updateError);
      return new Response(
        JSON.stringify({
          error: 'Failed to update course with manifest data',
          toast: {
            title: 'Error',
            description: 'Failed to save manifest data',
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
        manifestInfo,
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