import { parse as parseXML } from 'https://deno.land/x/xml@2.1.1/mod.ts'

export interface ScormManifest {
  version?: string;
  title?: string;
  description?: string;
  startingPage?: string;
  scormVersion?: string;
  metadata: {
    schema?: string;
    schemaVersion?: string;
    authors: Array<{
      name?: string;
      date?: string;
      role?: string;
    }>;
    objectives: Array<{
      id?: string;
      description?: string;
      primaryObjective?: boolean;
      minNormalizedMeasure?: number;
      satisfiedByMeasure?: boolean;
    }>;
    prerequisites: string[];
    technicalRequirements?: {
      type?: string;
      name?: string;
      minimumVersion?: string;
      maximumVersion?: string;
      platform?: string;
      browserRequirements?: string[];
    };
    masteryCriteria?: {
      masteryScore?: number;
      minAttempts?: number;
      maxAttempts?: number;
    };
    timeConstraints?: {
      attemptLimit?: number;
      timeLimitAction?: string;
      maxTimeAllowed?: string;
    };
    completionRequirements?: {
      completionThreshold?: number;
      requiredProgress?: number;
      minimumTime?: string;
    };
    keywords?: string[];
    rights?: {
      copyright?: string;
      description?: string;
      cost?: string;
    };
    language?: string;
    difficulty?: string;
    typicalLearningTime?: string;
  };
  organizations: {
    default: string;
    items: Array<{
      identifier: string;
      title: string;
      description?: string;
      objectives?: Array<{
        id: string;
        description?: string;
      }>;
      prerequisites?: string[];
      masteryScore?: number;
      maxTimeAllowed?: string;
      timeLimitAction?: string;
      dataFromLMS?: string;
      completionThreshold?: number;
      sequencing?: {
        controlMode?: {
          choice?: boolean;
          choiceExit?: boolean;
          flow?: boolean;
          forwardOnly?: boolean;
        };
        limitConditions?: {
          attemptLimit?: number;
          attemptAbsoluteDurationLimit?: string;
        };
        rollupRules?: Array<{
          childActivitySet?: string;
          minimumCount?: number;
          minimumPercent?: number;
          action?: string;
          conditions?: Array<{
            operator?: string;
            condition?: string;
          }>;
        }>;
      };
      items?: Array<{
        identifier: string;
        title: string;
        launch?: string;
        masteryScore?: number;
        prerequisites?: string[];
        objectives?: Array<{
          id: string;
          description?: string;
        }>;
      }>;
    }>;
  };
  resources: Array<{
    identifier: string;
    type: string;
    href?: string;
    scormType?: string;
    base?: string;
    metadata?: {
      description?: string;
      requirements?: string;
    };
    dependencies?: string[];
    files?: string[];
  }>;
  sequencing?: {
    controlMode?: {
      choice?: boolean;
      choiceExit?: boolean;
      flow?: boolean;
      forwardOnly?: boolean;
    };
    limitConditions?: {
      attemptLimit?: number;
      attemptAbsoluteDurationLimit?: string;
    };
    rollupRules?: Array<{
      childActivitySet?: string;
      minimumCount?: number;
      minimumPercent?: number;
      action?: string;
      conditions?: Array<{
        operator?: string;
        condition?: string;
      }>;
    }>;
  };
}

export async function parseManifest(xmlString: string): Promise<ScormManifest> {
  try {
    console.log('Parsing manifest XML...');
    const xmlDoc = parseXML(xmlString);
    
    // Extract metadata
    const metadata = findNode(xmlDoc, 'metadata');
    const schema = metadata ? findNode(metadata, 'schema')?.value : undefined;
    const schemaVersion = metadata ? findNode(metadata, 'schemaversion')?.value : undefined;
    
    // Determine SCORM version
    const scormVersion = determineScormVersion(schema, schemaVersion);
    
    // Extract organizations
    const organizations = extractOrganizations(xmlDoc);
    
    // Extract resources
    const resources = extractResources(xmlDoc);
    
    // Extract metadata details
    const manifestMetadata = extractMetadata(metadata);
    
    // Find starting page
    const startingPage = findStartingPage(xmlDoc, organizations, resources);
    
    // Get title from organization or metadata
    const title = organizations.items[0]?.title || manifestMetadata.title || findValue(xmlDoc, 'organization > title');
    
    // Extract sequencing information
    const sequencing = extractSequencing(findNode(xmlDoc, 'sequencing'));

    console.log('Successfully parsed manifest:', {
      title,
      scormVersion,
      metadata: manifestMetadata,
      organizations,
      resources,
      sequencing
    });

    return {
      title,
      scormVersion,
      metadata: manifestMetadata,
      organizations,
      resources,
      sequencing,
      startingPage
    };
  } catch (error) {
    console.error('Error parsing manifest:', error);
    throw new Error('Failed to parse SCORM manifest: ' + error.message);
  }
}

function extractMetadata(metadataNode: any): ScormManifest['metadata'] {
  if (!metadataNode) {
    return {
      authors: [],
      objectives: [],
      prerequisites: []
    };
  }

  const lom = findNode(metadataNode, 'lom');
  
  return {
    schema: findValue(metadataNode, 'schema'),
    schemaVersion: findValue(metadataNode, 'schemaversion'),
    authors: extractAuthors(findNode(metadataNode, 'contribute')),
    objectives: extractObjectives(findNode(metadataNode, 'objective')),
    prerequisites: extractPrerequisites(metadataNode),
    technicalRequirements: extractTechnicalRequirements(lom),
    masteryCriteria: extractMasteryCriteria(metadataNode),
    timeConstraints: extractTimeConstraints(metadataNode),
    completionRequirements: extractCompletionRequirements(metadataNode),
    keywords: extractKeywords(lom),
    rights: extractRights(lom),
    language: findValue(lom, 'language'),
    difficulty: findValue(lom, 'difficulty'),
    typicalLearningTime: findValue(lom, 'typicalLearningTime')
  };
}

function extractAuthors(contributeNode: any): Array<{ name?: string; date?: string; role?: string }> {
  if (!contributeNode) return [];
  
  const contributors = Array.isArray(contributeNode) ? contributeNode : [contributeNode];
  return contributors
    .filter(c => findValue(c, 'role') === 'author')
    .map(c => ({
      name: findValue(c, 'entity'),
      date: findValue(c, 'date'),
      role: findValue(c, 'role')
    }));
}

function extractObjectives(objectiveNode: any): Array<{
  id?: string;
  description?: string;
  primaryObjective?: boolean;
  minNormalizedMeasure?: number;
  satisfiedByMeasure?: boolean;
}> {
  if (!objectiveNode) return [];
  
  const objectives = Array.isArray(objectiveNode) ? objectiveNode : [objectiveNode];
  return objectives.map(obj => ({
    id: obj.attributes?.identifier,
    description: findValue(obj, 'description'),
    primaryObjective: obj.attributes?.primaryObjective === 'true',
    minNormalizedMeasure: parseFloat(findValue(obj, 'minNormalizedMeasure') || '0'),
    satisfiedByMeasure: obj.attributes?.satisfiedByMeasure === 'true'
  }));
}

function extractTechnicalRequirements(lomNode: any) {
  if (!lomNode) return null;
  
  const technical = findNode(lomNode, 'technical');
  if (!technical) return null;
  
  return {
    type: findValue(technical, 'type'),
    name: findValue(technical, 'name'),
    minimumVersion: findValue(technical, 'minimumversion'),
    maximumVersion: findValue(technical, 'maximumversion'),
    platform: findValue(technical, 'platform'),
    browserRequirements: extractMultipleValues(technical, 'otherPlatformRequirements')
  };
}

function extractMasteryCriteria(metadataNode: any) {
  const masteryScore = findValue(metadataNode, 'masteryscore');
  if (!masteryScore) return undefined;
  
  return {
    masteryScore: parseFloat(masteryScore),
    minAttempts: parseInt(findValue(metadataNode, 'minattempts') || '0'),
    maxAttempts: parseInt(findValue(metadataNode, 'maxattempts') || '0')
  };
}

function extractTimeConstraints(metadataNode: any) {
  const timeLimit = findValue(metadataNode, 'timelimitaction');
  if (!timeLimit) return undefined;
  
  return {
    attemptLimit: parseInt(findValue(metadataNode, 'attemptlimit') || '0'),
    timeLimitAction: timeLimit,
    maxTimeAllowed: findValue(metadataNode, 'maxtimeallowed')
  };
}

function extractCompletionRequirements(metadataNode: any) {
  const completionThreshold = findValue(metadataNode, 'completionthreshold');
  if (!completionThreshold) return undefined;
  
  return {
    completionThreshold: parseFloat(completionThreshold),
    requiredProgress: parseFloat(findValue(metadataNode, 'requiredprogress') || '0'),
    minimumTime: findValue(metadataNode, 'minimumtime')
  };
}

function extractKeywords(lomNode: any): string[] {
  if (!lomNode) return [];
  
  const keywords = findNodes(lomNode, 'keyword');
  return keywords.map(k => findValue(k, 'string')).filter(Boolean);
}

function extractRights(lomNode: any) {
  if (!lomNode) return undefined;
  
  const rights = findNode(lomNode, 'rights');
  if (!rights) return undefined;
  
  return {
    copyright: findValue(rights, 'copyrightAndOtherRestrictions'),
    description: findValue(rights, 'description'),
    cost: findValue(rights, 'cost')
  };
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

function findValue(node: any, path: string): string | undefined {
  const parts = path.split('>')
  let current = node
  
  for (const part of parts) {
    const trimmed = part.trim()
    if (!current[trimmed]) return undefined
    current = current[trimmed]
  }
  
  return current?.['$text'] || undefined
}

function determineScormVersion(schema: string | undefined, schemaVersion: string | undefined): string {
  if (schema?.includes('2004')) return 'SCORM 2004';
  if (schema?.includes('1.2')) return 'SCORM 1.2';
  if (schemaVersion?.includes('2004')) return 'SCORM 2004';
  if (schemaVersion?.includes('1.2')) return 'SCORM 1.2';
  
  // Default to 1.2 if version cannot be determined
  return 'SCORM 1.2';
}

function findStartingPage(xmlDoc: any, organizations: any, resources: any): string | undefined {
  // Try to find in default organization
  const organizationsDefault = organizations.default;
  if (organizationsDefault) {
    const org = Array.isArray(organizations.items) ?
      organizations.items.find((o: any) => o.identifier === organizationsDefault) :
      organizations.items;
    
    if (org?.items) {
      const firstItem = Array.isArray(org.items) ? org.items[0] : org.items;
      const resourceId = firstItem?.launch;
      if (resourceId) {
        const resource = resources.find((r: any) => r.identifier === resourceId);
        if (resource?.href) return resource.href;
      }
    }
  }
  
  // Fallback to first resource with href
  const resourceArray = Array.isArray(resources) ? resources : [resources];
  const firstResource = resourceArray.find(r => r.href && r.scormType === 'sco');
  return firstResource?.href;
}

function extractOrganizations(xmlDoc: any): any {
  const organizationsNode = findNode(xmlDoc, 'organizations');
  if (!organizationsNode) return { default: '', items: [] };
  
  const defaultOrg = organizationsNode.attributes?.default || '';
  const items = findNodes(organizationsNode, 'organization').map(org => ({
    identifier: org.attributes?.identifier || '',
    title: findValue(org, 'title'),
    description: findValue(org, 'description'),
    items: findNodes(org, 'item').map(item => ({
      identifier: item.attributes?.identifier || '',
      title: findValue(item, 'title'),
      launch: item.attributes?.identifierref
    }))
  }));
  
  return { default: defaultOrg, items };
}

function extractResources(xmlDoc: any): any[] {
  const resourcesNode = findNode(xmlDoc, 'resources');
  if (!resourcesNode) return [];
  
  return findNodes(resourcesNode, 'resource').map(resource => ({
    identifier: resource.attributes?.identifier || '',
    type: resource.attributes?.type || '',
    href: resource.attributes?.href,
    scormType: resource.attributes?.scormtype,
    base: resource.attributes?.base,
    metadata: {
      description: findValue(resource, 'metadata > description'),
      requirements: findValue(resource, 'metadata > requirements')
    },
    dependencies: extractDependencies(resource),
    files: extractFiles(resource)
  }));
}

function extractDependencies(resource: any): string[] {
  const dependenciesNode = findNodes(resource, 'dependency');
  return dependenciesNode.map(dep => dep.attributes?.identifierref).filter(Boolean);
}

function extractFiles(resource: any): string[] {
  const filesNode = findNodes(resource, 'file');
  return filesNode.map(file => file.attributes?.href).filter(Boolean);
}
