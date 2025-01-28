import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { parse as parseXML } from "https://deno.land/x/xml@2.1.1/mod.ts";

console.log('Process SCORM function started');

interface ManifestResult {
  title?: string;
  version?: string;
  scormVersion: string;
  status: string;
  startingPage?: string;
  description?: string;
  prerequisites?: string[];
  metadata: {
    schema?: string;
    schemaVersion?: string;
    keywords?: string[];
    duration?: string;
    copyright?: string;
  };
  organizations: {
    default: string;
    items: Array<{
      identifier: string;
      title: string;
      description?: string;
      objectives?: {
        primary?: {
          id: string;
          satisfiedByMeasure: boolean;
          minNormalizedMeasure: number;
        };
        secondary: Array<{
          id: string;
          description?: string;
        }>;
      };
      sequencing?: {
        controlMode?: {
          choice: boolean;
          flow: boolean;
        };
        deliveryControls?: {
          completionSetByContent: boolean;
          objectiveSetByContent: boolean;
        };
      };
      resourceId?: string;
    }>;
  };
  resources: Array<{
    identifier: string;
    type: string;
    href?: string;
    scormType?: string;
    files: string[];
    dependencies?: string[];
  }>;
}

function detectScormVersion(manifest: any): string {
  // Check schema definition
  const schemaVersion = manifest['@schemaversion'] || '';
  const xmlns = manifest['@xmlns'] || '';
  const metadataSchema = manifest.metadata?.schema?.['#text'] || '';
  
  if (xmlns.includes('2004') || schemaVersion.includes('2004') || metadataSchema.includes('2004')) {
    return 'SCORM 2004';
  }
  if (xmlns.includes('1.2') || schemaVersion.includes('1.2') || metadataSchema.includes('1.2')) {
    return 'SCORM 1.2';
  }
  
  // Additional checks for SCORM version
  const adlcpPrefix = Object.keys(manifest).find(key => key.includes('adlcp:'));
  if (adlcpPrefix?.includes('2004')) {
    return 'SCORM 2004';
  }
  
  console.warn('No explicit SCORM version found, checking for version-specific elements');
  
  // Check for SCORM 2004-specific elements
  if (manifest['imsss:sequencing'] || manifest['adlseq:objectives']) {
    return 'SCORM 2004';
  }
  
  // Default to 1.2 if no version indicators found
  return 'SCORM 1.2';
}

function parseMetadata(metadataNode: any) {
  const metadata: ManifestResult['metadata'] = {
    keywords: []
  };
  
  if (!metadataNode) return metadata;

  // Parse schema information
  metadata.schema = metadataNode.schema?.['#text'];
  metadata.schemaVersion = metadataNode.schemaversion?.['#text'];
  
  // Parse LOM metadata if present
  const lom = metadataNode['lom:lom'] || metadataNode.lom;
  if (lom) {
    const general = lom.general?.[0] || lom.general;
    if (general) {
      metadata.keywords = (general.keyword || [])
        .map((k: any) => k['string']?.['#text'] || k['#text'])
        .filter(Boolean);
    }
    
    const technical = lom.technical?.[0] || lom.technical;
    if (technical) {
      metadata.duration = technical.duration?.['#text'];
    }
    
    const rights = lom.rights?.[0] || lom.rights;
    if (rights) {
      metadata.copyright = rights.description?.['#text'];
    }
  }
  
  return metadata;
}

function parseOrganizations(organizationsNode: any) {
  const result = {
    default: '',
    items: [] as ManifestResult['organizations']['items']
  };

  if (!organizationsNode) return result;

  result.default = organizationsNode['@default'] || '';
  
  const organizations = organizationsNode.organization || [];
  const orgArray = Array.isArray(organizations) ? organizations : [organizations];
  
  result.items = orgArray.map((org: any) => {
    const item = {
      identifier: org['@identifier'] || '',
      title: org.title?.['#text'] || 'Untitled',
      description: org.description?.['#text'],
      resourceId: org['@identifierref'],
      objectives: parseObjectives(org.objectives),
      sequencing: parseSequencing(org.sequencing)
    };
    
    return item;
  });

  return result;
}

function parseObjectives(objectivesNode: any) {
  if (!objectivesNode) return { secondary: [] };

  const primaryObjective = objectivesNode['primaryObjective']?.[0];
  const secondaryObjectives = objectivesNode['objective'] || [];

  return {
    primary: primaryObjective ? {
      id: primaryObjective['@objectiveID'] || '',
      satisfiedByMeasure: primaryObjective['@satisfiedByMeasure'] === 'true',
      minNormalizedMeasure: parseFloat(primaryObjective['minNormalizedMeasure']?.['#text'] || '0')
    } : undefined,
    secondary: (Array.isArray(secondaryObjectives) ? secondaryObjectives : [secondaryObjectives])
      .map((obj: any) => ({
        id: obj['@objectiveID'] || '',
        description: obj['description']?.['#text']
      }))
  };
}

function parseSequencing(sequencingNode: any) {
  if (!sequencingNode) return undefined;

  const controlMode = sequencingNode['controlMode']?.[0];
  const deliveryControls = sequencingNode['deliveryControls']?.[0];

  return {
    controlMode: controlMode ? {
      choice: controlMode['@choice'] === 'true',
      flow: controlMode['@flow'] === 'true'
    } : undefined,
    deliveryControls: deliveryControls ? {
      completionSetByContent: deliveryControls['@completionSetByContent'] === 'true',
      objectiveSetByContent: deliveryControls['@objectiveSetByContent'] === 'true'
    } : undefined
  };
}

function parseResources(resourcesNode: any) {
  const resources: ManifestResult['resources'] = [];

  if (!resourcesNode?.resource) return resources;

  const resourceList = Array.isArray(resourcesNode.resource) 
    ? resourcesNode.resource 
    : [resourcesNode.resource];

  resources.push(...resourceList.map((resource: any) => ({
    identifier: resource['@identifier'] || '',
    type: resource['@type'] || '',
    href: resource['@href'],
    scormType: resource['@adlcp:scormtype'] || resource['@scormtype'],
    files: parseFiles(resource.file),
    dependencies: parseDependencies(resource.dependency)
  })));

  return resources;
}

function parseFiles(files: any): string[] {
  if (!files) return [];
  
  const fileArray = Array.isArray(files) ? files : [files];
  return fileArray
    .map((file: any) => file['@href'])
    .filter(Boolean);
}

function parseDependencies(dependencies: any): string[] {
  if (!dependencies) return [];
  
  const depArray = Array.isArray(dependencies) ? dependencies : [dependencies];
  return depArray
    .map((dep: any) => dep['@identifierref'])
    .filter(Boolean);
}

function findStartingPage(resources: ManifestResult['resources']): string | undefined {
  // Look for SCO resource first
  const scoResource = resources.find(r => 
    r.scormType?.toLowerCase() === 'sco' && r.href
  );
  
  if (scoResource?.href) {
    return scoResource.href;
  }

  // Fallback to first resource with href
  return resources.find(r => r.href)?.href;
}

async function parseManifest(manifestContent: string): Promise<ManifestResult> {
  console.log('Starting manifest parsing...');
  
  try {
    const manifestObj = parseXML(manifestContent);
    console.log('XML parsed successfully');

    if (!manifestObj || !manifestObj.manifest) {
      throw new Error('Invalid manifest: No manifest element found');
    }

    const manifest = manifestObj.manifest;
    console.log('Manifest element found, detecting SCORM version...');
    
    const scormVersion = detectScormVersion(manifest);
    console.log('Detected SCORM version:', scormVersion);

    // Parse main sections
    const metadata = parseMetadata(manifest.metadata);
    const organizations = parseOrganizations(manifest.organizations);
    const resources = parseResources(manifest.resources);
    
    // Find starting page
    const startingPage = findStartingPage(resources);
    console.log('Starting page:', startingPage);

    // Extract prerequisites if available
    const prerequisites = Array.from(manifest.prerequisites || [])
      .map((p: any) => p['#text'])
      .filter(Boolean);

    // Get title from organizations or metadata
    const title = organizations.items[0]?.title || 
                 manifest.title?.['#text'] ||
                 'Untitled Course';

    const description = manifest.description?.['#text'];

    const result: ManifestResult = {
      title,
      description,
      version: metadata.schemaVersion,
      scormVersion,
      status: 'processed',
      startingPage,
      prerequisites: prerequisites.length > 0 ? prerequisites : undefined,
      metadata,
      organizations,
      resources
    };

    console.log('Successfully parsed manifest:', result);
    return result;

  } catch (error) {
    console.error('Error parsing manifest:', error);
    throw new Error(`Failed to parse manifest: ${error.message}`);
  }
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
    
    const manifestInfo = await parseManifest(manifestContent);
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