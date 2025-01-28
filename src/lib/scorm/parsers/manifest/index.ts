import { parseMetadata } from './metadataParser';
import { parseOrganizations } from './organizationsParser';
import { parseResources } from './resourcesParser';
import { parseSequencing } from './sequencingParser';
import { detectScormVersion } from './versionParser';
import { ManifestData } from './types';
import { logDebug, logError } from '../../../utils/logger';

export function parseManifest(manifestXml: string): ManifestData {
  logDebug('Starting manifest parsing...');
  logDebug('Manifest XML length:', manifestXml.length);
  
  try {
    // Parse XML document
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(manifestXml, 'text/xml');
    const manifestElement = xmlDoc.documentElement;

    if (!manifestElement) {
      throw new Error('Invalid manifest: No manifest element found');
    }

    // Log manifest element details
    logDebug('Manifest element:', {
      name: manifestElement.nodeName,
      attributes: Array.from(manifestElement.attributes)
    });

    // Detect SCORM version
    const scormVersion = detectScormVersion(manifestElement);
    logDebug('Detected SCORM version:', scormVersion);

    // Parse main sections
    const metadata = parseMetadata(manifestElement.querySelector('metadata'));
    const organizations = parseOrganizations(manifestElement.querySelector('organizations'));
    const resources = parseResources(manifestElement.querySelector('resources'));
    const sequencing = parseSequencing(manifestElement.querySelector('imsss\\:sequencing'));

    // Find starting page
    const startingPage = findStartingPage(resources, organizations);

    const result: ManifestData = {
      title: metadata.title || organizations.items[0]?.title || 'Untitled Course',
      version: metadata.version,
      scormVersion,
      status: 'processed',
      startingPage,
      metadata,
      organizations,
      resources,
      sequencing
    };

    logDebug('Final manifest parsing result:', result);
    return result;

  } catch (error) {
    logError('Error parsing manifest:', error);
    throw error;
  }
}

function findStartingPage(resources: Resource[], organizations: OrganizationsResult): string | undefined {
  // First try to find it in organizations
  if (organizations.default && organizations.items.length > 0) {
    const defaultOrg = organizations.items.find(org => 
      org.identifier === organizations.default
    );
    
    if (defaultOrg?.resourceId) {
      const resource = resources.find(r => r.identifier === defaultOrg.resourceId);
      if (resource?.href) {
        return resource.href;
      }
    }
  }

  // Look for SCO resource
  const scoResource = resources.find(r => 
    r.scormType?.toLowerCase() === 'sco' && r.href
  );
  if (scoResource?.href) {
    return scoResource.href;
  }

  // Fallback to first resource with href
  return resources.find(r => r.href)?.href;
}