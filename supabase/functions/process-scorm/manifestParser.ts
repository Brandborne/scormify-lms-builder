import { parse as parseXML } from 'https://deno.land/x/xml@2.1.1/mod.ts';

export async function parseManifest(manifestContent: string): Promise<any> {
  console.log('Starting manifest parsing...');
  
  try {
    const xmlObj = parseXML(manifestContent);
    console.log('XML parsing successful');

    if (!xmlObj || !xmlObj.manifest) {
      throw new Error('Invalid manifest: No manifest element found');
    }

    const manifest = xmlObj.manifest[0] || xmlObj.manifest;
    console.log('Processing manifest element:', manifest);
    
    // Get basic manifest attributes
    const identifier = manifest['@identifier'];
    const version = manifest['@version'];
    
    // Parse metadata
    const metadata = parseMetadata(manifest.metadata?.[0]);
    console.log('Parsed metadata:', metadata);

    // Parse organizations
    const organizations = parseOrganizations(manifest.organizations?.[0]);
    console.log('Parsed organizations:', organizations);

    // Parse resources
    const resources = parseResources(manifest.resources?.[0]);
    console.log('Parsed resources:', resources);

    // Find starting page
    const startingPage = findStartingPage(resources, organizations);
    console.log('Found starting page:', startingPage);

    // Detect SCORM version
    const scormVersion = detectScormVersion(manifest);
    console.log('Detected SCORM version:', scormVersion);

    const result = {
      identifier,
      version,
      title: metadata.title || organizations.items[0]?.title || 'Untitled Course',
      description: metadata.description,
      scormVersion,
      status: 'processed',
      startingPage,
      metadata,
      organizations,
      resources
    };

    console.log('Final manifest parsing result:', result);
    return result;

  } catch (error) {
    console.error('Error parsing manifest:', error);
    throw new Error(`Failed to parse manifest: ${error.message}`);
  }
}

function parseMetadata(metadataNode: any): any {
  console.log('Parsing metadata from node:', metadataNode);
  
  if (!metadataNode) {
    return {};
  }

  // Try both namespaced and non-namespaced nodes
  const title = 
    metadataNode?.['title']?.[0]?.['#text'] ||
    metadataNode?.['adlcp:title']?.[0]?.['#text'] ||
    metadataNode?.['imsmd:title']?.[0]?.['#text'];
    
  const description = 
    metadataNode?.['description']?.[0]?.['#text'] ||
    metadataNode?.['adlcp:description']?.[0]?.['#text'] ||
    metadataNode?.['imsmd:description']?.[0]?.['#text'];

  const result = {
    title,
    description,
    version: metadataNode?.['version']?.[0]?.['#text']
  };

  console.log('Parsed metadata result:', result);
  return result;
}

function parseOrganizations(organizationsNode: any): any {
  console.log('Parsing organizations from node:', organizationsNode);
  
  if (!organizationsNode) {
    return { default: '', items: [] };
  }

  const defaultOrg = organizationsNode['@default'];
  const organizations = organizationsNode['organization'] || [];

  const items = (Array.isArray(organizations) ? organizations : [organizations])
    .map(parseOrganizationItem)
    .filter(Boolean);

  const result = {
    default: defaultOrg || '',
    items
  };

  console.log('Parsed organizations result:', result);
  return result;
}

function parseOrganizationItem(item: any): any {
  if (!item) return null;

  const identifier = item['@identifier'];
  const title = item['title']?.[0]?.['#text'];
  const resourceId = item['@identifierref'];

  // Handle both namespaced and non-namespaced prerequisites
  const prerequisites = item['adlcp:prerequisites']?.map((prereq: any) => 
    prereq['#text']
  ).filter(Boolean);

  const children = item['item']?.map((childItem: any) => 
    parseOrganizationItem(childItem)
  ).filter(Boolean);

  return {
    identifier,
    title,
    prerequisites: prerequisites?.length ? prerequisites : undefined,
    resourceId,
    children: children?.length ? children : undefined
  };
}

function parseResources(resourcesNode: any): any[] {
  console.log('Parsing resources from node:', resourcesNode);
  
  if (!resourcesNode?.resource) {
    return [];
  }

  const resources = Array.isArray(resourcesNode.resource) 
    ? resourcesNode.resource 
    : [resourcesNode.resource];

  return resources.map((resource: any) => {
    const parsed = {
      identifier: resource['@identifier'],
      type: resource['@type'],
      href: resource['@href'],
      scormType: resource['@adlcp:scormtype'] || resource['@scormType'],
      files: parseFiles(resource.file),
      dependencies: parseDependencies(resource.dependency)
    };

    console.log('Parsed resource:', parsed);
    return parsed;
  });
}

function parseFiles(files: any): string[] {
  if (!files) return [];
  
  const fileArray = Array.isArray(files) ? files : [files];
  return fileArray.map((file: any) => file['@href']).filter(Boolean);
}

function parseDependencies(dependencies: any): string[] {
  if (!dependencies) return [];
  
  const depArray = Array.isArray(dependencies) ? dependencies : [dependencies];
  return depArray.map((dep: any) => dep['@identifierref']).filter(Boolean);
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

function detectScormVersion(manifest: any): string {
  // Check metadata schema version first
  const schema = manifest.metadata?.[0]?.['schema']?.[0]?.['#text'];
  if (schema) {
    if (schema.includes('2004')) return 'SCORM 2004';
    if (schema.includes('1.2')) return 'SCORM 1.2';
  }
  
  // Check namespace attributes
  const xmlns = manifest['@xmlns'];
  if (xmlns) {
    if (xmlns.includes('2004')) return 'SCORM 2004';
    if (xmlns.includes('1.2')) return 'SCORM 1.2';
  }

  // Check for version-specific elements
  const hasScorm2004Elements = manifest['imsss:sequencing'] || 
                              manifest['adlseq:objectives'] ||
                              manifest['adlnav:presentation'];
  
  if (hasScorm2004Elements) {
    return 'SCORM 2004';
  }

  return 'SCORM 1.2';
}