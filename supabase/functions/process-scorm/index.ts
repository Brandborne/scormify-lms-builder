import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

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
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    if (!xmlDoc || xmlDoc.getElementsByTagName('parsererror').length > 0) {
      throw new Error('Invalid XML content');
    }

    const manifest = xmlDoc.documentElement;
    console.log('Manifest element found');

    // Detect SCORM version
    const scormVersion = detectScormVersion(manifest);
    console.log('Detected SCORM version:', scormVersion);

    // Parse metadata
    const metadata = parseMetadata(manifest.querySelector('metadata'));
    console.log('Metadata parsed:', metadata);

    // Parse organizations
    const organizations = parseOrganizations(manifest.querySelector('organizations'));
    console.log('Organizations parsed:', organizations);

    // Parse resources
    const resources = parseResources(manifest.querySelector('resources'));
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

function detectScormVersion(manifest: Element): string {
  const xmlns = manifest.getAttribute('xmlns');
  const schemaVersion = manifest.querySelector('metadata schemaversion')?.textContent;
  
  if (xmlns?.includes('2004') || schemaVersion?.includes('2004')) {
    return 'SCORM 2004';
  }
  if (xmlns?.includes('1.2') || schemaVersion?.includes('1.2')) {
    return 'SCORM 1.2';
  }
  return 'Unknown';
}

function parseMetadata(metadataElement: Element | null) {
  const metadata: ManifestResult['metadata'] = {};
  
  if (metadataElement) {
    metadata.schema = metadataElement.querySelector('schema')?.textContent || undefined;
    metadata.schemaVersion = metadataElement.querySelector('schemaversion')?.textContent || undefined;
    metadata.keywords = Array.from(metadataElement.querySelectorAll('keyword'))
      .map(k => k.textContent || '')
      .filter(k => k.length > 0);
    metadata.duration = metadataElement.querySelector('duration')?.textContent || undefined;
  }
  
  return metadata;
}

function parseOrganizations(organizationsElement: Element | null) {
  const result = {
    default: '',
    items: [] as ManifestResult['organizations']['items']
  };

  if (organizationsElement) {
    result.default = organizationsElement.getAttribute('default') || '';
    
    const organizations = organizationsElement.querySelectorAll('organization');
    organizations.forEach(org => {
      result.items.push({
        identifier: org.getAttribute('identifier') || '',
        title: org.querySelector('title')?.textContent || 'Untitled',
        resourceId: org.getAttribute('identifierref')
      });
    });
  }

  return result;
}

function parseResources(resourcesElement: Element | null) {
  const resources: ManifestResult['resources'] = [];

  if (resourcesElement) {
    const resourceElements = resourcesElement.querySelectorAll('resource');
    resourceElements.forEach(resource => {
      resources.push({
        identifier: resource.getAttribute('identifier') || '',
        type: resource.getAttribute('type') || '',
        href: resource.getAttribute('href') || undefined,
        scormType: resource.getAttribute('adlcp:scormtype') || resource.getAttribute('scormtype') || undefined,
        files: Array.from(resource.querySelectorAll('file'))
          .map(file => file.getAttribute('href') || '')
          .filter(href => href.length > 0)
      });
    });
  }

  return resources;
}

function findStartingPage(resources: ManifestResult['resources']): string | undefined {
  // First try to find a SCO resource
  const scoResource = resources.find(r => 
    r.scormType?.toLowerCase() === 'sco' && r.href
  );
  
  if (scoResource?.href) {
    return scoResource.href;
  }
  
  // Fallback to first resource with an href
  return resources.find(r => r.href)?.href;
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