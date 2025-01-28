import { parse as parseXML } from 'https://deno.land/x/xml@2.1.1/mod.ts'

export interface ScormManifest {
  identifier?: string;
  version?: string;
  title?: string;
  description?: string;
  startingPage?: string;
  scormVersion?: string;
  metadata: {
    schema?: string;
    schemaVersion?: string;
    objectives: {
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

    // Extract title
    const title = findValue(organization, 'title');

    // Extract objectives
    const sequencingNode = findNode(organization, 'sequencing') || findNode(findNode(organization, 'item'), 'sequencing');
    const objectivesNode = sequencingNode ? findNode(sequencingNode, 'objectives') : null;
    
    const objectives = {
      primary: extractPrimaryObjective(objectivesNode),
      secondary: extractSecondaryObjectives(objectivesNode)
    };

    // Extract sequencing information
    const sequencing = {
      controlMode: extractControlMode(sequencingNode),
      deliveryControls: extractDeliveryControls(sequencingNode)
    };

    // Extract resources
    const resources = extractResources(manifest.resources);

    // Find starting page
    const startingPage = findStartingPage(resources);

    console.log('Successfully parsed manifest:', {
      title,
      metadata: { schema, schemaVersion, objectives, sequencing },
      organizations: { default: defaultOrg, items: extractOrganizationItems(organization) },
      resources,
      startingPage
    });

    return {
      title,
      scormVersion: determineScormVersion(schema, schemaVersion),
      metadata: {
        schema,
        schemaVersion,
        objectives,
        sequencing
      },
      organizations: {
        default: defaultOrg || '',
        items: extractOrganizationItems(organization)
      },
      resources,
      startingPage
    };
  } catch (error) {
    console.error('Error parsing manifest:', error);
    throw new Error('Failed to parse SCORM manifest: ' + error.message);
  }
}

function extractPrimaryObjective(objectivesNode: any) {
  if (!objectivesNode) return undefined;

  const primaryObj = findNode(objectivesNode, 'primaryObjective');
  if (!primaryObj) return undefined;

  return {
    id: primaryObj['@objectiveID'] || '',
    satisfiedByMeasure: primaryObj['@satisfiedByMeasure'] === 'true',
    minNormalizedMeasure: parseFloat(findValue(primaryObj, 'minNormalizedMeasure') || '0')
  };
}

function extractSecondaryObjectives(objectivesNode: any): Array<{ id: string; description?: string }> {
  if (!objectivesNode) return [];

  const objectives = findNodes(objectivesNode, 'objective');
  return objectives
    .filter(obj => !obj['@primary'])
    .map(obj => ({
      id: obj['@objectiveID'] || '',
      description: obj['description']?.['#text']
    }));
}

function extractControlMode(sequencingNode: any) {
  if (!sequencingNode) return undefined;

  const controlMode = findNode(sequencingNode, 'controlMode');
  if (!controlMode) return undefined;

  return {
    choice: controlMode['@choice'] === 'true',
    flow: controlMode['@flow'] === 'true'
  };
}

function extractDeliveryControls(sequencingNode: any) {
  if (!sequencingNode) return undefined;

  const deliveryControls = findNode(sequencingNode, 'deliveryControls');
  if (!deliveryControls) return undefined;

  return {
    completionSetByContent: deliveryControls['@completionSetByContent'] === 'true',
    objectiveSetByContent: deliveryControls['@objectiveSetByContent'] === 'true'
  };
}

function extractResources(resourcesNode: any): Array<{
  identifier: string;
  type: string;
  href?: string;
  scormType?: string;
  files: string[];
}> {
  if (!resourcesNode) return [];

  const resources = findNodes(resourcesNode, 'resource');
  return resources.map(resource => ({
    identifier: resource['@identifier'] || '',
    type: resource['@type'] || '',
    href: resource['@href'],
    scormType: resource['@scormType'],
    files: extractFiles(resource)
  }));
}

function extractFiles(resourceNode: any): string[] {
  if (!resourceNode) return [];

  const files = findNodes(resourceNode, 'file');
  return files.map(file => file['@href']).filter(Boolean);
}

function extractOrganizationItems(organizationNode: any): Array<{
  identifier: string;
  title: string;
  resourceId?: string;
}> {
  if (!organizationNode) return [];

  const items = findNodes(organizationNode, 'item');
  return items.map(item => ({
    identifier: item['@identifier'] || '',
    title: findValue(item, 'title') || '',
    resourceId: item['@identifierref']
  }));
}

function findStartingPage(resources: any[]): string | undefined {
  const mainResource = resources.find(r => r.scormType?.toLowerCase() === 'sco');
  return mainResource?.href;
}

function determineScormVersion(schema?: string, schemaVersion?: string): string {
  if (schema?.includes('2004') || schemaVersion?.includes('2004')) {
    return 'SCORM 2004';
  }
  return 'SCORM 1.2';
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

function findNodes(node: any, name: string): any[] {
  const results: any[] = [];
  if (!node) return results;
  
  // Check direct properties
  if (node[name]) {
    if (Array.isArray(node[name])) {
      results.push(...node[name]);
    } else {
      results.push(node[name]);
    }
  }
  
  // Check children array
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (child.name === name) results.push(child);
      results.push(...findNodes(child, name));
    }
  }
  
  return results;
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