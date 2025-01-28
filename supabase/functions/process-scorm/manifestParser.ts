import { parse as parseXML } from 'https://deno.land/x/xml@2.1.1/mod.ts'

export interface ScormManifest {
  version?: string;
  title?: string;
  description?: string;
  startingPage?: string;
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
    files?: string[];
  }>;
}

export async function parseManifest(xmlString: string): Promise<ScormManifest> {
  try {
    console.log('Parsing manifest XML...');
    const xmlDoc = parseXML(xmlString);
    
    // Get metadata
    const metadata = findNode(xmlDoc, 'metadata');
    const schemaVersion = findNode(metadata, 'schemaversion')?.value;
    console.log('Schema version:', schemaVersion);

    // Determine SCORM version from metadata
    let scormVersion = schemaVersion || 'SCORM 1.2';
    
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

    // Parse resources
    const resources = findNodes(xmlDoc, 'resource').map(resource => ({
      identifier: resource.attributes?.identifier || '',
      type: resource.attributes?.type || '',
      href: resource.attributes?.href,
      files: findNodes(resource, 'file').map(file => file.attributes?.href).filter(Boolean),
      dependencies: findNodes(resource, 'dependency')
        .map(dep => dep.attributes?.identifierref)
        .filter(Boolean)
    }));

    // Find starting page
    let startingPage: string | undefined;

    // First try to get the href from the resource referenced by the first item
    if (organizations.default && organizations.items.length > 0) {
      const defaultOrg = organizations.items.find(org => 
        org.identifier === organizations.default
      );
      if (defaultOrg?.items?.[0]?.launch) {
        const resourceNode = resources.find(res => 
          res.identifier === defaultOrg.items[0].launch
        );
        startingPage = resourceNode?.href;
      }
    }

    // If no starting page found in organizations, try first resource with href
    if (!startingPage && resources.length > 0) {
      startingPage = resources[0].href;
    }

    // Get title from first organization
    const title = organizations.items[0]?.title;

    console.log('Successfully parsed manifest:', {
      scormVersion,
      title,
      startingPage,
      organizations,
      resources
    });

    return {
      version: schemaVersion,
      scormVersion,
      title,
      startingPage,
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