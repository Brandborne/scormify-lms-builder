import { parseMetadata } from './parsers/metadataParser.ts';
import { parseOrganizations } from './parsers/organizationsParser.ts';
import { parseResources } from './parsers/resourcesParser.ts';
import { parse as parseXML } from 'https://deno.land/x/xml@2.1.1/mod.ts';

export async function parseManifest(manifestContent: string): Promise<any> {
  console.log('Starting manifest parsing with content length:', manifestContent.length);
  console.log('Raw manifest content:', manifestContent);
  
  try {
    const xmlObj = parseXML(manifestContent);
    console.log('XML parsing successful, manifest structure:', JSON.stringify(xmlObj, null, 2));

    if (!xmlObj || !xmlObj.manifest) {
      throw new Error('Invalid manifest: No manifest element found');
    }

    const manifest = xmlObj.manifest[0] || xmlObj.manifest;
    console.log('Processing manifest element:', JSON.stringify(manifest, null, 2));
    
    // Detect SCORM version from namespace or schema
    const scormVersion = detectScormVersion(manifest);
    console.log('Detected SCORM version:', scormVersion);

    // Parse metadata
    console.log('Parsing metadata from:', JSON.stringify(manifest.metadata?.[0], null, 2));
    const metadata = parseMetadata(manifest.metadata?.[0]);
    console.log('Parsed metadata result:', JSON.stringify(metadata, null, 2));

    // Parse organizations
    console.log('Parsing organizations from:', JSON.stringify(manifest.organizations?.[0], null, 2));
    const organizations = parseOrganizations(manifest.organizations?.[0]);
    console.log('Parsed organizations result:', JSON.stringify(organizations, null, 2));

    // Parse resources
    console.log('Parsing resources from:', JSON.stringify(manifest.resources?.[0], null, 2));
    const resources = parseResources(manifest.resources?.[0]);
    console.log('Parsed resources result:', JSON.stringify(resources, null, 2));

    const result = {
      title: metadata.title || organizations.items[0]?.title || 'Untitled Course',
      version: metadata.version,
      scormVersion,
      status: 'processed',
      startingPage: findStartingPage(resources, organizations),
      metadata,
      organizations,
      resources
    };

    console.log('Final manifest parsing result:', JSON.stringify(result, null, 2));
    return result;

  } catch (error) {
    console.error('Error parsing manifest:', error);
    console.error('Error stack:', error.stack);
    throw new Error(`Failed to parse manifest: ${error.message}`);
  }
}

function detectScormVersion(manifest: any): string {
  console.log('Detecting SCORM version from manifest:', manifest);

  // Check namespace attributes
  const xmlns = manifest['@xmlns'];
  const adlcpXmlns = manifest['@xmlns:adlcp'];
  
  if (adlcpXmlns?.includes('2004')) return 'SCORM 2004';
  if (xmlns?.includes('2004')) return 'SCORM 2004';
  
  return 'SCORM 1.2';
}

function findStartingPage(resources: any[], organizations: any): string | undefined {
  // First try to find it in organizations
  const defaultOrg = organizations.items.find((org: any) => 
    org.identifier === organizations.default
  );

  if (defaultOrg?.items?.[0]?.resourceId) {
    const resource = resources.find(r => 
      r.identifier === defaultOrg.items[0].resourceId
    );
    if (resource?.href) return resource.href;
  }

  // If not found in organizations, look for first SCO resource
  const scoResource = resources.find(r => 
    r.scormType?.toLowerCase() === 'sco' && r.href
  );
  if (scoResource?.href) return scoResource.href;

  // Fallback to first resource with href
  return resources.find(r => r.href)?.href;
}