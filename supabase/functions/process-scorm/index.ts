import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { parse as parseXML } from "https://deno.land/x/xml@2.1.1/mod.ts";

console.log('Process SCORM function started');

interface ManifestResult {
  title?: string;
  version?: string;
  scormVersion: string;
  startingPage?: string;
  description?: string;
  metadata: {
    schema?: string;
    schemaVersion?: string;
    keywords?: string[];
    duration?: string;
  };
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
    files: string[];
  }>;
}

function parseManifest(xmlContent: string): ManifestResult {
  console.log('Starting manifest parsing');
  
  try {
    // Parse XML using Deno's XML parser
    const manifestObj = parseXML(xmlContent);
    console.log('XML parsed successfully');

    if (!manifestObj || !manifestObj.manifest) {
      throw new Error('No manifest element found');
    }

    console.log('Manifest element found');

    // Helper function to safely access nested properties
    const getNestedValue = (obj: any, path: string[], defaultValue: any = undefined) => {
      return path.reduce((curr, key) => (curr && curr[key] ? curr[key] : defaultValue), obj);
    };

    // Detect SCORM version from metadata or namespace
    const scormVersion = detectScormVersion(manifestObj.manifest);
    console.log('Detected SCORM version:', scormVersion);

    // Parse metadata
    const metadata = parseMetadata(manifestObj.manifest.metadata);
    console.log('Metadata parsed:', metadata);

    // Parse organizations
    const organizations = parseOrganizations(manifestObj.manifest.organizations);
    console.log('Organizations parsed:', organizations);

    // Parse resources
    const resources = parseResources(manifestObj.manifest.resources);
    console.log('Resources parsed:', resources);

    // Find starting page
    const startingPage = findStartingPage(resources);
    console.log('Starting page found:', startingPage);

    return {
      title: organizations.items[0]?.title || metadata.title,
      version: metadata.schemaVersion,
      scormVersion,
      startingPage,
      description: metadata.description,
      metadata,
      organizations,
      resources
    };
  } catch (error) {
    console.error('Error parsing manifest:', error);
    throw new Error(`Failed to parse manifest: ${error.message}`);
  }
}

function detectScormVersion(manifest: any): string {
  const xmlns = manifest['@xmlns'] || '';
  const schemaVersion = getNestedValue(manifest, ['metadata', 'schemaversion', '#text'], '');
  
  if (xmlns.includes('2004') || schemaVersion.includes('2004')) {
    return 'SCORM 2004';
  }
  if (xmlns.includes('1.2') || schemaVersion.includes('1.2')) {
    return 'SCORM 1.2';
  }
  return 'Unknown';
}

function parseMetadata(metadataElement: any) {
  const metadata: ManifestResult['metadata'] = {};
  
  if (metadataElement) {
    metadata.schema = getNestedValue(metadataElement, ['schema', '#text']);
    metadata.schemaVersion = getNestedValue(metadataElement, ['schemaversion', '#text']);
    metadata.keywords = getNestedValue(metadataElement, ['keywords'], [])
      .map((k: any) => k['#text'])
      .filter((k: string) => k && k.length > 0);
    metadata.duration = getNestedValue(metadataElement, ['duration', '#text']);
  }
  
  return metadata;
}

function parseOrganizations(organizationsElement: any) {
  const result = {
    default: '',
    items: [] as ManifestResult['organizations']['items']
  };

  if (organizationsElement) {
    result.default = organizationsElement['@default'] || '';
    
    const organizations = organizationsElement.organization || [];
    const orgArray = Array.isArray(organizations) ? organizations : [organizations];
    
    result.items = orgArray.map((org: any) => ({
      identifier: org['@identifier'] || '',
      title: getNestedValue(org, ['title', '#text'], 'Untitled'),
      resourceId: org['@identifierref']
    }));
  }

  return result;
}

function parseResources(resourcesElement: any) {
  const resources: ManifestResult['resources'] = [];

  if (resourcesElement && resourcesElement.resource) {
    const resourceList = Array.isArray(resourcesElement.resource) 
      ? resourcesElement.resource 
      : [resourcesElement.resource];

    resources.push(...resourceList.map((resource: any) => ({
      identifier: resource['@identifier'] || '',
      type: resource['@type'] || '',
      href: resource['@href'],
      scormType: resource['@adlcp:scormtype'] || resource['@scormtype'],
      files: (resource.file || []).map((file: any) => file['@href']).filter(Boolean)
    })));
  }

  return resources;
}

function findStartingPage(resources: ManifestResult['resources']): string | undefined {
  const scoResource = resources.find(r => 
    r.scormType?.toLowerCase() === 'sco' && r.href
  );
  
  return scoResource?.href || resources.find(r => r.href)?.href;
}

// Helper function to safely get nested values
function getNestedValue(obj: any, path: string[], defaultValue: any = undefined) {
  if (!obj) return defaultValue;
  return path.reduce((curr, key) => (curr && curr[key] !== undefined ? curr[key] : defaultValue), obj);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
      }
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
    console.log('Parsing manifest content...');
    
    const manifestInfo = parseManifest(manifestContent);
    console.log('Successfully parsed manifest:', manifestInfo);

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