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
    const schemaVersion = metadata ? findNode(metadata, 'schemaversion')?.value : undefined;
    console.log('Schema version:', schemaVersion);

    // Determine SCORM version from metadata
    const scormVersion = schemaVersion || 'SCORM 1.2';
    
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
        if (!org) return;
        
        const orgItem = {
          identifier: org.attributes?.identifier || '',
          title: findNode(org, 'title')?.value || '',
          items: []
        };

        const itemNodes = findNodes(org, 'item');
        itemNodes.forEach(item => {
          if (!item) return;
          
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
    const resources = findNodes(xmlDoc, 'resource').map(resource => {
      if (!resource) return null;
      
      return {
        identifier: resource.attributes?.identifier || '',
        type: resource.attributes?.type || '',
        href: resource.attributes?.href,
        files: findNodes(resource, 'file')
          .map(file => file?.attributes?.href)
          .filter((href): href is string => !!href),
        dependencies: findNodes(resource, 'dependency')
          .map(dep => dep?.attributes?.identifierref)
          .filter((ref): ref is string => !!ref)
      };
    }).filter((res): res is NonNullable<typeof res> => res !== null);

    // Find starting page from the first resource with href
    let startingPage = resources[0]?.href;

    // If no starting page found in resources, try to get it from organization items
    if (!startingPage && organizations.items.length > 0) {
      const firstItem = organizations.items[0].items?.[0];
      if (firstItem?.launch) {
        const resourceWithLaunch = resources.find(res => 
          res.identifier === firstItem.launch
        );
        startingPage = resourceWithLaunch?.href;
      }
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

// Helper functions to traverse XML nodes with null checks
function findNode(node: any, name: string): any {
  if (!node) return null;
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
  if (!node) return results;
  
  if (node.name === name) results.push(node);
  if (node.children) {
    for (const child of node.children) {
      results.push(...findNodes(child, name));
    }
  }
  return results;
}