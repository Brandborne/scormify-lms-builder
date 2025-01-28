import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';

console.log('Process SCORM function started');

interface ManifestData {
  title?: string;
  version?: string;
  scormVersion: string;
  status: string;
  startingPage?: string;
  metadata: Record<string, any>;
  organizations: {
    default: string;
    items: Array<{
      identifier: string;
      title: string;
      resourceId?: string;
    }>;
  };
  resources: Array<{
    identifier: string;
    type: string;
    href?: string;
    scormType?: string;
  }>;
}

async function parseManifest(xmlString: string): Promise<ManifestData> {
  console.log('Parsing manifest XML, length:', xmlString.length);
  console.log('First 500 chars of manifest:', xmlString.substring(0, 500));

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    if (!xmlDoc) {
      console.error('Failed to parse XML document');
      throw new Error('Failed to parse XML document');
    }

    // Check for XML parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      console.error('XML Parse Error:', parseError.textContent);
      throw new Error(`Invalid XML format in manifest: ${parseError.textContent}`);
    }

    const manifestElement = xmlDoc.documentElement;
    console.log('Manifest element tag name:', manifestElement.tagName);

    // Detect SCORM version
    const metadata = manifestElement.querySelector('metadata');
    const schema = metadata?.querySelector('schema')?.textContent;
    console.log('Schema found:', schema);

    let scormVersion = 'SCORM 1.2'; // Default
    if (schema?.includes('2004')) {
      scormVersion = 'SCORM 2004';
    }
    console.log('Detected SCORM version:', scormVersion);

    // Get title (try multiple possible locations)
    const title = manifestElement.querySelector('organization > title')?.textContent ||
                 manifestElement.querySelector('organizations > organization > title')?.textContent ||
                 manifestElement.querySelector('metadata > title')?.textContent ||
                 'Untitled Course';
    console.log('Title found:', title);

    // Parse organizations
    const organizationsElement = manifestElement.querySelector('organizations');
    const organizations = {
      default: organizationsElement?.getAttribute('default') || '',
      items: [] as Array<{ identifier: string; title: string; resourceId?: string; }>
    };

    const orgElements = organizationsElement?.querySelectorAll('organization');
    if (orgElements) {
      console.log('Found organizations:', orgElements.length);
      orgElements.forEach(org => {
        const orgItem = {
          identifier: org.getAttribute('identifier') || '',
          title: org.querySelector('title')?.textContent || '',
          resourceId: org.getAttribute('identifierref')
        };
        organizations.items.push(orgItem);
        console.log('Parsed organization:', orgItem);
      });
    }

    // Parse resources
    const resources: Array<{
      identifier: string;
      type: string;
      href?: string;
      scormType?: string;
    }> = [];

    const resourceElements = manifestElement.querySelectorAll('resource');
    if (resourceElements) {
      console.log('Found resources:', resourceElements.length);
      resourceElements.forEach(resource => {
        const resourceItem = {
          identifier: resource.getAttribute('identifier') || '',
          type: resource.getAttribute('type') || '',
          href: resource.getAttribute('href'),
          scormType: resource.getAttribute('adlcp:scormtype') || 
                    resource.getAttribute('scormType')
        };
        resources.push(resourceItem);
        console.log('Parsed resource:', resourceItem);
      });
    }

    // Find starting page
    let startingPage: string | undefined;

    // First try to find it in organizations
    if (organizations.items.length > 0) {
      const defaultOrg = organizations.items.find(org => 
        org.identifier === organizations.default
      );
      if (defaultOrg?.resourceId) {
        const resource = resources.find(r => r.identifier === defaultOrg.resourceId);
        startingPage = resource?.href;
      }
    }

    // If not found, look in resources
    if (!startingPage && resources.length > 0) {
      const scoResource = resources.find(r => 
        r.scormType?.toLowerCase() === 'sco' && r.href
      );
      startingPage = scoResource?.href || resources[0].href;
    }

    console.log('Starting page found:', startingPage);

    const manifestData: ManifestData = {
      title,
      scormVersion,
      status: 'processed',
      startingPage,
      metadata: {
        schema,
      },
      organizations,
      resources
    };

    console.log('Final manifest data:', JSON.stringify(manifestData, null, 2));
    return manifestData;

  } catch (error) {
    console.error('Error parsing manifest:', error);
    throw new Error(`Failed to parse SCORM manifest: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    console.log('Processing SCORM request');
    const { courseId } = await req.json();

    if (!courseId) {
      throw new Error('Course ID is required');
    }

    // Initialize Supabase client
    console.log('Initializing Supabase client');
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

    // Find manifest file (ignore macOS system files)
    const manifestFile = files.find(file => 
      !file.name.startsWith('._') && 
      !file.name.startsWith('__MACOSX') && 
      file.name.toLowerCase() === 'imsmanifest.xml'
    );

    if (!manifestFile) {
      console.error('No manifest file found in directory:', course.course_files_path);
      throw new Error('No manifest file found in package');
    }

    console.log('Found manifest file:', manifestFile.name);

    // Download manifest
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
    console.log('Successfully downloaded manifest content');
    
    const manifestInfo = await parseManifest(manifestContent);
    console.log('Successfully parsed manifest:', JSON.stringify(manifestInfo, null, 2));

    // Update course with processed manifest data
    console.log('Updating course with manifest data');
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
    console.error('Error processing SCORM package:', error);
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