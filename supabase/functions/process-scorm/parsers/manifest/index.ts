import { parseXML } from './xmlParser.ts';
import { parseMetadata } from './metadataParser.ts';
import { parseOrganizations } from './organizationsParser.ts';
import { parseResources } from './resourcesParser.ts';
import { detectScormVersion } from './versionParser.ts';
import type { ManifestResult } from '../types/manifest.ts';

export function parseManifest(manifestXml: string): ManifestResult {
  console.log('Starting manifest parsing...');
  console.log('Manifest XML length:', manifestXml.length);
  console.log('First 500 chars:', manifestXml.substring(0, 500));
  
  try {
    // Parse XML document
    const doc = parseXML(manifestXml);
    const manifestElement = doc.root;

    if (!manifestElement) {
      throw new Error('Invalid manifest: No manifest element found');
    }

    // Log manifest element details
    console.log('Manifest element:', {
      name: manifestElement.name,
      attributes: manifestElement.attributes
    });

    // Detect SCORM version
    const scormVersion = detectScormVersion(manifestElement);
    console.log('Detected SCORM version:', scormVersion);

    // Parse main sections
    const metadata = parseMetadata(manifestElement.children?.find((child: any) => 
      child.name === 'metadata'
    ));
    console.log('Parsed metadata:', metadata);

    const organizations = parseOrganizations(manifestElement.children?.find((child: any) => 
      child.name === 'organizations'
    ));
    console.log('Parsed organizations:', organizations);

    const resources = parseResources(manifestElement.children?.find((child: any) => 
      child.name === 'resources'
    ));
    console.log('Parsed resources:', resources);

    // Find starting page
    const startingPage = findStartingPage(resources, organizations);
    console.log('Determined starting page:', startingPage);

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

    console.log('Final manifest parsing result:', JSON.stringify(result, null, 2));
    return result;

  } catch (error) {
    console.error('Error parsing manifest:', error);
    throw new Error(`Failed to parse manifest: ${error.message}`);
  }
}

function findStartingPage(resources: any[], organizations: any): string | undefined {
  console.log('Finding starting page from:', {
    resourceCount: resources.length,
    organizations
  });
  
  // First try to find it in organizations
  if (organizations.default && organizations.items.length > 0) {
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
  }

  // Look for SCO resource
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