import { parseMetadata } from './MetadataParser';
import { parseOrganizations } from './OrganizationsParser';
import { parseResources } from './ResourcesParser';
import { parseSequencing } from './SequencingParser';
import { detectScormVersion } from './VersionParser';
import type { ManifestData, Resource, OrganizationsResult } from './types';
import { logDebug, logError } from '../../utils/logger';
import { parseXML } from '../xml/xmlParser';

export function parseManifest(manifestXml: string): ManifestData {
  logDebug('Starting manifest parsing...');
  logDebug('Manifest XML length:', manifestXml.length);
  
  try {
    // Parse XML document
    const doc = parseXML(manifestXml);
    const manifestElement = doc.root;

    if (!manifestElement) {
      throw new Error('Invalid manifest: No manifest element found');
    }

    // Log manifest element details
    logDebug('Manifest element:', {
      tagName: manifestElement.tagName,
      attributes: manifestElement.attributes
    });

    // Detect SCORM version
    const scormVersion = detectScormVersion(manifestElement);
    logDebug('Detected SCORM version:', scormVersion);

    // Parse main sections
    const metadataNode = Array.from(manifestElement.children)
      .find(child => child.nodeName.toLowerCase() === 'metadata');
    const metadata = parseMetadata(metadataNode);
    logDebug('Parsed metadata:', metadata);

    const organizationsNode = Array.from(manifestElement.children)
      .find(child => child.nodeName.toLowerCase() === 'organizations');
    const organizations = parseOrganizations(organizationsNode);
    logDebug('Parsed organizations:', organizations);

    const resourcesNode = Array.from(manifestElement.children)
      .find(child => child.nodeName.toLowerCase() === 'resources');
    const resources = parseResources(resourcesNode);
    logDebug('Parsed resources:', resources);

    // Find starting page
    const startingPage = findStartingPage(resources, organizations);
    logDebug('Determined starting page:', startingPage);

    const result: ManifestData = {
      title: metadata.title || organizations.items[0]?.title || 'Untitled Course',
      version: metadata.version,
      scormVersion,
      status: 'processed',
      startingPage,
      metadata,
      organizations,
      resources
    };

    logDebug('Final manifest parsing result:', result);
    return result;

  } catch (error) {
    logError('Error parsing manifest:', error);
    throw error;
  }
}

function findStartingPage(resources: Resource[], organizations: OrganizationsResult): string | undefined {
  logDebug('Finding starting page from:', {
    resourceCount: resources.length,
    organizations
  });
  
  // First try to find it in organizations
  if (organizations.default && organizations.items.length > 0) {
    const defaultOrg = organizations.items.find(org => 
      org.identifier === organizations.default
    );
    
    if (defaultOrg?.resourceId) {
      logDebug('Found resource ID in default organization:', defaultOrg.resourceId);
      const resource = resources.find(r => r.identifier === defaultOrg.resourceId);
      if (resource?.href) {
        logDebug('Found starting page in organizations:', resource.href);
        return resource.href;
      }
    }
  }

  // Look for SCO resource
  const scoResource = resources.find(r => 
    r.scormType?.toLowerCase() === 'sco' && r.href
  );
  if (scoResource?.href) {
    logDebug('Found SCO resource with href:', scoResource.href);
    return scoResource.href;
  }

  // Fallback to first resource with href
  const firstResourceWithHref = resources.find(r => r.href)?.href;
  logDebug('Fallback to first resource with href:', firstResourceWithHref);
  return firstResourceWithHref;
}