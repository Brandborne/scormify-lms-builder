import { parse as parseXML } from 'https://deno.land/x/xml@2.1.1/mod.ts'

export interface ScormManifest {
  version?: string;
  title?: string;
  description?: string;
  startingPage?: string;
  prerequisites?: string[];
  scormVersion?: string;
  organizations?: {
    default: string;
    items: Array<{
      identifier: string;
      title: string;
      items?: Array<{
        identifier: string;
        title: string;
        launch?: string;
      }>;
    }>;
  };
  resources?: Array<{
    identifier: string;
    type: string;
    href?: string;
    dependencies?: string[];
  }>;
}

export async function parseManifest(xmlString: string): Promise<ScormManifest> {
  try {
    console.log('Parsing manifest XML...');
    const xmlDoc = parseXML(xmlString);
    
    // Determine SCORM version
    let scormVersion = 'SCORM 1.2'; // Default version
    const schemaVersion = findNode(xmlDoc, 'schemaversion');
    if (schemaVersion?.value?.includes('2004')) {
      scormVersion = 'SCORM 2004';
    }

    // Get metadata
    const metadata = findNode(xmlDoc, 'metadata');
    if (metadata) {
      const schema = findNode(metadata, 'schema');
      if (schema?.value?.includes('SCORM')) {
        scormVersion = schema.value;
      }
    }

    // Get title and description
    const title = findNode(xmlDoc, 'title')?.value;
    const description = findNode(xmlDoc, 'description')?.value;

    // Parse organizations
    const organizations: ScormManifest['organizations'] = {
      default: '',
      items: []
    };

    const orgsNode = findNode(xmlDoc, 'organizations');
    if (orgsNode) {
      organizations.default = orgsNode.attributes?.default || '';
      
      const orgNodes = findNodes(orgsNode, 'organization');
      orgNodes.forEach(org => {
        const orgItem = {
          identifier: org.attributes?.identifier || '',
          title: findNode(org, 'title')?.value || '',
          items: []
        };

        const itemNodes = findNodes(org, 'item');
        itemNodes.forEach(item => {
          orgItem.items?.push({
            identifier: item.attributes?.identifier || '',
            title: findNode(item, 'title')?.value || '',
            launch: item.attributes?.identifierref
          });
        });

        organizations.items.push(orgItem);
      });
    }

    // Find starting page
    let startingPage: string | undefined;

    // First try organizations
    if (organizations.default) {
      const defaultOrg = organizations.items.find(org => 
        org.identifier === organizations.default
      );
      if (defaultOrg?.items?.[0]?.launch) {
        const resourceNode = findNodes(xmlDoc, 'resource').find(res => 
          res.attributes?.identifier === defaultOrg.items[0].launch
        );
        startingPage = resourceNode?.attributes?.href;
      }
    }

    // Fallback to first resource
    if (!startingPage) {
      const firstResource = findNode(xmlDoc, 'resource');
      startingPage = firstResource?.attributes?.href;
    }

    // Parse prerequisites
    const prerequisiteNodes = findNodes(xmlDoc, 'prerequisites');
    const prerequisites = prerequisiteNodes
      .map(node => node.value)
      .filter(Boolean);

    // Parse resources
    const resources = findNodes(xmlDoc, 'resource').map(resource => ({
      identifier: resource.attributes?.identifier || '',
      type: resource.attributes?.type || '',
      href: resource.attributes?.href,
      dependencies: findNodes(resource, 'dependency')
        .map(dep => dep.attributes?.identifierref)
        .filter(Boolean)
    }));

    console.log('Successfully parsed manifest:', {
      scormVersion,
      title,
      startingPage,
      organizations
    });

    return {
      version: schemaVersion?.value,
      scormVersion,
      title,
      description,
      startingPage,
      prerequisites: prerequisites.length > 0 ? prerequisites : undefined,
      organizations,
      resources
    };
  } catch (error) {
    console.error('Error parsing manifest:', error);
    throw new Error('Failed to parse SCORM manifest: ' + error.message);
  }
}

// Helper functions to traverse XML nodes
function findNode(node: any, name: string): any {
  if (node.name === name) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, name);
      if (found) return found;
    }
  }
  return null;
}

function findNodes(node: any, name: string): any[] {
  const results: any[] = [];
  if (node.name === name) results.push(node);
  if (node.children) {
    for (const child of node.children) {
      results.push(...findNodes(child, name));
    }
  }
  return results;
}