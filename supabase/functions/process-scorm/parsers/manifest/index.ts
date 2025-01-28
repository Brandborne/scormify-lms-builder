import { parseMetadata } from './metadataParser.ts';
import { parseOrganizations } from './organizationsParser.ts';
import { parseResources } from './resourcesParser.ts';
import { parseSequencing } from './sequencingParser.ts';
import { detectScormVersion } from './versionParser.ts';
import type { ManifestResult, Resource, OrganizationsResult } from './types.ts';
import { logDebug, logError } from '../../utils/logger.ts';
import { parseXML } from '../xml/xmlParser.ts';

export function parseManifest(manifestXml: string): ManifestResult {
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
      name: manifestElement.name,
      attributes: manifestElement.attributes
    });

    // Detect SCORM version
    const scormVersion = detectScormVersion(manifestElement);
    logDebug('Detected SCORM version:', scormVersion);

    // Parse main sections
    const metadata = parseMetadata(manifestElement.children?.find((child: any) => 
      child.name === 'metadata'
    ));
    logDebug('Parsed metadata:', metadata);

    const organizations = parseOrganizations(manifestElement.children?.find((child: any) => 
      child.name === 'organizations'
    ));
    logDebug('Parsed organizations:', organizations);

    const resources = parseResources(manifestElement.children?.find((child: any) => 
      child.name === 'resources'
    ));
    logDebug('Parsed resources:', resources);

    // Find starting page
    const startingPage = findStartingPage(resources, organizations);
    logDebug('Determined starting page:', startingPage);

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