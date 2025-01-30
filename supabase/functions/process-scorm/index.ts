import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';
import { XMLParser } from 'npm:fast-xml-parser';
import { validateManifestXML, parseManifestData } from './processors/manifestProcessor.ts';
import { getCourse, updateCourseManifest } from './db/courseOperations.ts';
import { createErrorResponse, createSuccessResponse, logDebug } from './utils/index.ts';

console.log('Process SCORM function initialized');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId } = await req.json();
    logDebug('Processing SCORM package for course:', courseId);

    if (!courseId) {
      throw new Error('Course ID is required');
    }

    const course = await getCourse(courseId);
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

    const { data: files, error: listError } = await supabaseClient
      .storage
      .from('scorm_packages')
      .list(course.course_files_path);

    if (listError) {
      console.error('Error listing files:', listError);
      throw new Error('Failed to list course files');
    }

    const manifestFile = files.find(file => 
      !file.name.startsWith('._') && 
      !file.name.startsWith('__MACOSX') && 
      file.name.toLowerCase() === 'imsmanifest.xml'
    );

    if (!manifestFile) {
      throw new Error('No manifest file found in package');
    }

    const { data: manifestData, error: downloadError } = await supabaseClient
      .storage
      .from('scorm_packages')
      .download(`${course.course_files_path}/${manifestFile.name}`);

    if (downloadError || !manifestData) {
      throw new Error('Failed to download manifest file');
    }

    const manifestText = await manifestData.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });

    const validationResult = validateManifestXML(manifestText);
    logDebug('Manifest validation result:', validationResult);

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

    const result = parser.parse(manifestText);
    logDebug('Raw parsed XML:', result);

    const manifestInfo = parseManifestData(result);
    logDebug('Processed manifest data:', manifestInfo);

    await updateCourseManifest(courseId, manifestInfo);

    return createSuccessResponse({ manifestInfo });

  } catch (error) {
    return createErrorResponse(error);
  }
});