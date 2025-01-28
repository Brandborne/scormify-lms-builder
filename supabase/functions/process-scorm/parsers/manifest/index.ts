import { parseXML } from './xmlParser.ts';
import { parseMetadata } from './metadataParser.ts';
import { parseOrganizations } from './organizationsParser.ts';
import { parseResources } from './resourcesParser.ts';
import { detectScormVersion } from './versionParser.ts';
import type { ManifestResult } from '../types/manifest.ts';

export function parseManifest(manifestXml: string): ManifestResult {
  console.log('Starting manifest parsing...');
  console.log('Manifest XML length:', manifestXml.length);
  
  try {
    // Parse XML document
    const doc = parseXML(manifestXml);
    const manifestElement = doc.documentElement;

    if (!manifestElement) {
      throw new Error('Invalid manifest: No manifest element found');
    }

    console.log('Found manifest element, detecting SCORM version...');
    const scormVersion = detectScormVersion(manifestElement);
    console.log('Detected SCORM version:', scormVersion);

    // Parse main sections
    const metadata = parseMetadata(manifestElement.querySelector('metadata'));
    const organizations = parseOrganizations(manifestElement.querySelector('organizations'));
    const resources = parseResources(manifestElement.querySelector('resources'));

    // Find starting page
    const startingPage = findStartingPage(resources, organizations);
    console.log('Starting page:', startingPage);

    const result: ManifestResult = {
      title: metadata.title || organizations.items[0]?.title || 'Untitled Course',
      version: metadata.version,
      scormVersion,
      status: 'processed',
      startingPage,
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

function findStartingPage(resources: any[], organizations: any): string | undefined {
  console.log('Finding starting page...');
  
  // First try to find it in organizations
  const defaultOrg = organizations.items.find((org: any) => 
    org.identifier === organizations.default
  );

  if (defaultOrg?.resourceId) {
    console.log('Found resource ID in default organization:', defaultOrg.resourceId);
    const resource = resources.find(r => r.identifier === defaultOrg.resourceId);
    if (resource?.href) {
      console.log('Found starting page in organizations:', resource.href);
      return resource.href;
    }
  }

  // If not found in organizations, look for first SCO resource
  const scoResource = resources.find(r => 
    r.scormType?.toLowerCase() === 'sco' && r.href
  );
  if (scoResource?.href) {
    console.log('Found SCO resource with href:', scoResource.href);
    return scoResource.href;
  }

  // Fallback to first resource with href
  const firstResourceWithHref = resources.find(r => r.href)?.href;
  console.log('Fallback to first resource with href:', firstResourceWithHref);
  return firstResourceWithHref;
}