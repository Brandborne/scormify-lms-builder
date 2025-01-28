import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

export interface ManifestResult {
  title?: string;
  version?: string;
  scormVersion: string;
  status: string;
  startingPage?: string;
  prerequisites?: string[];
  metadata: {
    schema?: string;
    schemaVersion?: string;
    description?: string;
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

function detectScormVersion(manifest: Element): string {
  // Check schema definition
  const schemaVersion = manifest.getAttribute('version');
  if (schemaVersion?.includes('2004')) return 'SCORM 2004';
  if (schemaVersion?.includes('1.2')) return 'SCORM 1.2';
  
  // Check namespace
  const xmlns = manifest.getAttribute('xmlns');
  if (xmlns?.includes('2004')) return 'SCORM 2004';
  if (xmlns?.includes('1.2')) return 'SCORM 1.2';
  
  // Default to 1.2 if no version found
  console.warn('No SCORM version detected, defaulting to 1.2');
  return 'SCORM 1.2';
}

function parseMetadata(metadataElement: Element | null): ManifestResult['metadata'] {
  if (!metadataElement) return {};

  const schema = metadataElement.querySelector('schema')?.textContent;
  const schemaVersion = metadataElement.querySelector('schemaversion')?.textContent;
  const description = metadataElement.querySelector('description string')?.textContent;
  const keywords = Array.from(metadataElement.querySelectorAll('keyword string')).map(k => k.textContent || '');
  const duration = metadataElement.querySelector('duration')?.textContent;

  return {
    schema,
    schemaVersion,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    duration
  };
}

function parseOrganizations(organizationsElement: Element | null): ManifestResult['organizations'] {
  if (!organizationsElement) {
    return { default: '', items: [] };
  }

  const defaultOrg = organizationsElement.getAttribute('default') || '';
  const organizations = Array.from(organizationsElement.querySelectorAll('organization'));

  const items = organizations.map(org => ({
    identifier: org.getAttribute('identifier') || '',
    title: org.querySelector('title')?.textContent || '',
    resourceId: org.getAttribute('identifierref')
  }));

  return {
    default: defaultOrg,
    items
  };
}

function parseResources(resourcesElement: Element | null): ManifestResult['resources'] {
  if (!resourcesElement) return [];

  return Array.from(resourcesElement.querySelectorAll('resource')).map(resource => ({
    identifier: resource.getAttribute('identifier') || '',
    type: resource.getAttribute('type') || '',
    href: resource.getAttribute('href'),
    scormType: resource.getAttribute('adlcp:scormtype') || resource.getAttribute('scormtype'),
    files: Array.from(resource.querySelectorAll('file')).map(file => file.getAttribute('href') || '')
  }));
}

function findStartingPage(resources: ManifestResult['resources']): string | undefined {
  // Look for the main SCO resource
  const scoResource = resources.find(r => 
    r.scormType?.toLowerCase() === 'sco' && r.href
  );

  if (scoResource?.href) {
    return scoResource.href;
  }

  // Fallback to first resource with an href
  return resources.find(r => r.href)?.href;
}

export async function parseManifest(manifestContent: string): Promise<ManifestResult> {
  console.log('Starting manifest parsing...');
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(manifestContent, 'text/xml');
    
    if (!doc) {
      throw new Error('Failed to parse manifest XML');
    }

    const manifestElement = doc.querySelector('manifest');
    if (!manifestElement) {
      throw new Error('Invalid manifest: No manifest element found');
    }

    console.log('Manifest element found, detecting SCORM version...');
    const scormVersion = detectScormVersion(manifestElement);
    console.log('Detected SCORM version:', scormVersion);

    // Parse main sections
    const metadata = parseMetadata(manifestElement.querySelector('metadata'));
    const organizations = parseOrganizations(manifestElement.querySelector('organizations'));
    const resources = parseResources(manifestElement.querySelector('resources'));
    
    // Find starting page
    const startingPage = findStartingPage(resources);
    console.log('Starting page:', startingPage);

    // Extract prerequisites if available
    const prerequisites = Array.from(manifestElement.querySelectorAll('prerequisites')).map(p => p.textContent || '');

    // Get title from organizations or metadata
    const title = organizations.items[0]?.title || 
                 manifestElement.querySelector('title')?.textContent ||
                 'Untitled Course';

    const result: ManifestResult = {
      title,
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