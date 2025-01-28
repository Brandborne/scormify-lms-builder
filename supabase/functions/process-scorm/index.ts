import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";

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
  console.log('Starting manifest parsing...');
  console.log('XML string length:', xmlString.length);
  console.log('First 500 chars:', xmlString.substring(0, 500));

  try {
    const parsedXml = parse(xmlString);
    console.log('Parsed XML structure:', JSON.stringify(parsedXml, null, 2));

    // Validate parsed XML
    if (!parsedXml || typeof parsedXml !== 'object') {
      console.error('Invalid XML parsing result:', parsedXml);
      throw new Error('Failed to parse XML document');
    }

    // Get the manifest element (root)
    const manifestElement = parsedXml.root;
    console.log('Root element:', manifestElement);

    if (!manifestElement || manifestElement.name !== 'manifest') {
      console.error('Invalid manifest structure:', manifestElement);
      throw new Error('Invalid manifest: No manifest element found');
    }

    // Detect SCORM version from metadata or namespace
    let scormVersion = 'SCORM 1.2'; // Default version
    const metadata = manifestElement.children?.find((child: any) => child.name === 'metadata');
    
    if (metadata) {
      const schema = metadata.children?.find((child: any) => 
        child.name === 'schema' || child.name === 'lom:schema'
      )?.content;
      
      console.log('Schema found in metadata:', schema);
      if (schema?.includes('2004')) {
        scormVersion = 'SCORM 2004';
      }
    }

    // Parse title with multiple fallbacks
    const title = findFirstContent(manifestElement, [
      'organizations.organization.title',
      'metadata.title',
      'title'
    ]) || 'Untitled Course';
    console.log('Parsed title:', title);

    // Parse organizations
    const organizationsElement = findFirstChild(manifestElement, 'organizations');
    const organizations = {
      default: organizationsElement?.attributes?.default || '',
      items: []
    };

    if (organizationsElement?.children) {
      const orgElements = organizationsElement.children.filter((child: any) => 
        child.name === 'organization'
      );

      organizations.items = orgElements.map((org: any) => ({
        identifier: org.attributes?.identifier || '',
        title: findFirstContent(org, ['title']) || '',
        resourceId: org.attributes?.identifierref
      }));
    }

    console.log('Parsed organizations:', organizations);

    // Parse resources
    const resourcesElement = findFirstChild(manifestElement, 'resources');
    const resources = resourcesElement?.children
      ?.filter((child: any) => child.name === 'resource')
      .map((resource: any) => ({
        identifier: resource.attributes?.identifier || '',
        type: resource.attributes?.type || '',
        href: resource.attributes?.href,
        scormType: resource.attributes?.['adlcp:scormtype'] || 
                  resource.attributes?.scormType
      })) || [];

    console.log('Parsed resources:', resources);

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
        schema: metadata?.children?.find((child: any) => 
          child.name === 'schema'
        )?.content
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

// Helper function to find first matching content in nested structure
function findFirstContent(element: any, paths: string[]): string | undefined {
  for (const path of paths) {
    const parts = path.split('.');
    let current = element;
    
    for (const part of parts) {
      current = current?.children?.find((child: any) => child.name === part);
      if (!current) break;
    }
    
    if (current?.content) {
      return current.content;
    }
  }
  return undefined;
}

// Helper function to find first child by name
function findFirstChild(element: any, name: string): any {
  return element?.children?.find((child: any) => child.name === name);
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