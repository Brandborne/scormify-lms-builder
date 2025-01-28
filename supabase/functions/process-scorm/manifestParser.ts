import { parse as parseXML } from 'https://deno.land/x/xml@2.1.1/mod.ts'

export interface ScormManifest {
  title?: string;
  version?: string;
  scormVersion?: string;
  status?: string;
  metadata: {
    schema?: string;
    schemaVersion?: string;
    objectives?: {
      primary?: {
        id: string;
        satisfiedByMeasure: boolean;
        minNormalizedMeasure?: number;
      };
      secondary: Array<{
        id: string;
        description?: string;
      }>;
    };
    sequencing?: {
      controlMode?: {
        choice?: boolean;
        flow?: boolean;
      };
      deliveryControls?: {
        completionSetByContent?: boolean;
        objectiveSetByContent?: boolean;
      };
    };
  };
  organizations: {
    default: string;
    items: Array<{
      identifier: string;
      title: string;
      resourceId?: string;
      objectives?: {
        primary?: {
          id: string;
          satisfiedByMeasure: boolean;
          minNormalizedMeasure: number;
        };
        secondary: Array<{
          id: string;
        }>;
      };
      sequencing?: {
        deliveryControls?: {
          completionSetByContent: boolean;
          objectiveSetByContent: boolean;
        };
      };
    }>;
  };
  resources: Array<{
    identifier: string;
    type: string;
    href?: string;
    scormType?: string;
    files: string[];
  }>;
}

export async function parseManifest(xmlString: string): Promise<ScormManifest> {
  try {
    console.log('Parsing manifest XML...');
    const xmlDoc = parseXML(xmlString);
    const manifest = xmlDoc.manifest;

    // Extract metadata
    const metadata = findNode(manifest, 'metadata');
    const schema = metadata ? findValue(metadata, 'schema') : undefined;
    const schemaVersion = metadata ? findValue(metadata, 'schemaversion') : undefined;

    // Extract organizations
    const organizations = manifest.organizations;
    const defaultOrg = organizations?.['@default'];
    const organization = findNode(organizations, 'organization');

    // Extract title and items from organization
    const title = findValue(organization, 'title');
    const items = organization?.item ? (Array.isArray(organization.item) ? organization.item : [organization.item]) : [];

    // Process items to extract objectives and sequencing
    const processedItems = items.map(item => {
      const itemSequencing = findNode(item, 'sequencing');
      const objectives = findNode(itemSequencing, 'objectives');
      
      const primaryObjective = objectives?.primaryObjective ? {
        id: objectives.primaryObjective['@objectiveID'],
        satisfiedByMeasure: objectives.primaryObjective['@satisfiedByMeasure'] === 'true',
        minNormalizedMeasure: parseFloat(findValue(objectives.primaryObjective, 'minNormalizedMeasure') || '0')
      } : undefined;

      const secondaryObjectives = objectives?.objective ? 
        (Array.isArray(objectives.objective) ? objectives.objective : [objectives.objective])
          .map(obj => ({
            id: obj['@objectiveID']
          })) : [];

      const deliveryControls = itemSequencing?.deliveryControls ? {
        completionSetByContent: itemSequencing.deliveryControls['@completionSetByContent'] === 'true',
        objectiveSetByContent: itemSequencing.deliveryControls['@objectiveSetByContent'] === 'true'
      } : undefined;

      return {
        identifier: item['@identifier'],
        title: findValue(item, 'title'),
        resourceId: item['@identifierref'],
        objectives: {
          primary: primaryObjective,
          secondary: secondaryObjectives
        },
        sequencing: {
          deliveryControls
        }
      };
    });

    // Extract resources
    const resources = manifest.resources?.resource ? 
      (Array.isArray(manifest.resources.resource) ? manifest.resources.resource : [manifest.resources.resource])
        .map(resource => ({
          identifier: resource['@identifier'],
          type: resource['@type'],
          href: resource['@href'],
          scormType: resource['@scormType'],
          files: resource.file ? 
            (Array.isArray(resource.file) ? resource.file : [resource.file])
              .map(file => file['@href'])
            : []
        })) : [];

    // Extract sequencing from organization
    const orgSequencing = findNode(organization, 'sequencing');
    const controlMode = orgSequencing?.controlMode ? {
      choice: orgSequencing.controlMode['@choice'] === 'true',
      flow: orgSequencing.controlMode['@flow'] === 'true'
    } : undefined;

    console.log('Successfully parsed manifest:', {
      title,
      metadata: { schema, schemaVersion },
      organizations: { default: defaultOrg, items: processedItems },
      resources,
      sequencing: { controlMode }
    });

    return {
      title,
      scormVersion: determineScormVersion(schema, schemaVersion),
      status: 'processed',
      metadata: {
        schema,
        schemaVersion,
        sequencing: {
          controlMode
        }
      },
      organizations: {
        default: defaultOrg || '',
        items: processedItems
      },
      resources
    };
  } catch (error) {
    console.error('Error parsing manifest:', error);
    throw new Error('Failed to parse SCORM manifest: ' + error.message);
  }
}

// Helper functions
function findNode(node: any, name: string): any {
  if (!node) return null;
  
  // Check direct properties first
  if (node[name]) return node[name];
  
  // Check children array if it exists
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (child.name === name) return child;
      const found = findNode(child, name);
      if (found) return found;
    }
  }
  
  return null;
}

function findValue(node: any, path: string): string | undefined {
  if (!node) return undefined;
  
  const parts = path.split('.');
  let current = node;
  
  for (const part of parts) {
    if (!current[part]) return undefined;
    current = current[part];
  }
  
  return current['#text'] || current;
}

function determineScormVersion(schema?: string, schemaVersion?: string): string {
  if (schema?.includes('2004') || schemaVersion?.includes('2004')) {
    return 'SCORM 2004';
  }
  return 'SCORM 1.2';
}