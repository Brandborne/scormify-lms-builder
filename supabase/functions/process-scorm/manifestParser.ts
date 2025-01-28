import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// Type definitions
interface ObjectiveData {
  primary?: {
    id: string;
    satisfiedByMeasure: boolean;
    minNormalizedMeasure: number;
  };
  secondary: Array<{
    id: string;
    description?: string;
  }>;
}

interface SequencingData {
  controlMode?: {
    choice: boolean;
    flow: boolean;
  };
  deliveryControls?: {
    completionSetByContent: boolean;
    objectiveSetByContent: boolean;
  };
}

interface ResourceData {
  identifier: string;
  type: string;
  href?: string;
  scormType?: string;
  files: string[];
}

interface OrganizationItem {
  identifier: string;
  title: string;
  objectives?: ObjectiveData;
  sequencing?: SequencingData;
  resourceId?: string;
}

interface OrganizationsResult {
  default: string;
  items: OrganizationItem[];
}

interface MetadataResult {
  schema?: string;
  schemaVersion?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  version?: string;
  duration?: string;
  copyright?: string;
}

// Parser functions
function parseMetadata(metadataNode: any): MetadataResult {
  if (!metadataNode) return {};

  const lom = metadataNode['lom:lom']?.[0];
  if (!lom) return {};

  return {
    schema: lom['lom:schema']?.[0]?.['#text'],
    schemaVersion: lom['lom:schemaversion']?.[0]?.['#text'],
    title: lom['lom:general']?.[0]?.['lom:title']?.[0]?.['lom:string']?.[0]?.['#text'],
    description: lom['lom:general']?.[0]?.['lom:description']?.[0]?.['lom:string']?.[0]?.['#text'],
    keywords: lom['lom:general']?.[0]?.['lom:keyword']?.map((k: any) => k['lom:string']?.[0]?.['#text']),
    version: lom['lom:lifecycle']?.[0]?.['lom:version']?.[0]?.['lom:string']?.[0]?.['#text'],
    duration: lom['lom:technical']?.[0]?.['lom:duration']?.[0]?.['#text'],
    copyright: lom['lom:rights']?.[0]?.['lom:copyrightAndOtherRestrictions']?.[0]?.['lom:value']?.[0]?.['#text']
  };
}

function parseOrganizations(organizationsNode: any): OrganizationsResult {
  if (!organizationsNode) {
    return { default: '', items: [] };
  }

  const defaultOrg = organizationsNode['$default'];
  const organizations = organizationsNode['organization'] || [];

  const items = Array.isArray(organizations) 
    ? organizations.map(parseOrganizationItem)
    : [parseOrganizationItem(organizations)];

  return {
    default: defaultOrg || '',
    items
  };
}

function parseOrganizationItem(item: any): OrganizationItem {
  if (!item) return { identifier: '', title: '' };

  return {
    identifier: item['$identifier'] || '',
    title: item['title']?.[0]?.['#text'] || '',
    resourceId: item['$identifierref'],
  };
}

function parseResources(resourcesNode: any): ResourceData[] {
  if (!resourcesNode?.resource) return [];

  const resources = Array.isArray(resourcesNode.resource) 
    ? resourcesNode.resource 
    : [resourcesNode.resource];

  return resources.map((resource: any) => ({
    identifier: resource['$identifier'] || '',
    type: resource['$type'] || '',
    href: resource['$href'],
    scormType: resource['$adlcp:scormtype'] || resource['$adlcp:scormType'],
    files: parseFiles(resource.file)
  }));
}

function parseFiles(files: any): string[] {
  if (!files) return [];
  
  const fileArray = Array.isArray(files) ? files : [files];
  return fileArray.map((file: any) => file['$href']).filter(Boolean);
}

function parseSequencing(sequencingNode: any): SequencingData {
  if (!sequencingNode) return {};

  const controlMode = sequencingNode['imsss:controlMode']?.[0];
  const deliveryControls = sequencingNode['imsss:deliveryControls']?.[0];

  return {
    controlMode: controlMode ? {
      choice: controlMode['$choice'] === 'true',
      flow: controlMode['$flow'] === 'true'
    } : undefined,
    deliveryControls: deliveryControls ? {
      completionSetByContent: deliveryControls['$completionSetByContent'] === 'true',
      objectiveSetByContent: deliveryControls['$objectiveSetByContent'] === 'true'
    } : undefined
  };
}

function parseObjectives(objectivesNode: any): ObjectiveData {
  if (!objectivesNode) return { secondary: [] };

  const primaryObjective = objectivesNode['imsss:primaryObjective']?.[0];
  const secondaryObjectives = objectivesNode['imsss:objective'] || [];

  return {
    primary: primaryObjective ? {
      id: primaryObjective['$objectiveID'] || '',
      satisfiedByMeasure: primaryObjective['$satisfiedByMeasure'] === 'true',
      minNormalizedMeasure: parseFloat(primaryObjective['imsss:minNormalizedMeasure']?.[0]?.['#text'] || '0')
    } : undefined,
    secondary: Array.isArray(secondaryObjectives) 
      ? secondaryObjectives.map((obj: any) => ({
          id: obj['$objectiveID'] || '',
          description: obj['#text'] || undefined
        }))
      : []
  };
}

export async function parseManifestFile(manifestContent: string) {
  console.log('Processing manifest content:', manifestContent);
  
  try {
    // Convert XML string to JavaScript object
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(manifestContent, 'text/xml');
    
    // Convert XML document to a plain object for easier parsing
    const manifest = xmlToObj(xmlDoc.documentElement);
    console.log('Converted manifest object:', manifest);

    // Detect SCORM version
    const scormVersion = detectScormVersion(manifest);
    console.log('Detected SCORM version:', scormVersion);

    return {
      scormVersion,
      status: 'processed',
      metadata: parseMetadata(manifest.metadata?.[0]),
      organizations: parseOrganizations(manifest.organizations?.[0]),
      resources: parseResources(manifest.resources?.[0]),
      sequencing: parseSequencing(manifest['imsss:sequencing']?.[0]),
      objectives: parseObjectives(manifest.objectives?.[0])
    };
  } catch (error) {
    console.error('Error parsing manifest:', error);
    throw new Error(`Failed to parse manifest: ${error.message}`);
  }
}

function detectScormVersion(manifest: any): string {
  const schemaVersion = manifest?.metadata?.[0]?.['schema']?.[0]?.['#text'];
  if (schemaVersion?.includes('2004')) return 'SCORM 2004';
  if (schemaVersion?.includes('1.2')) return 'SCORM 1.2';
  
  // Fallback to checking namespace
  const xmlns = manifest['$xmlns'];
  if (xmlns?.includes('2004')) return 'SCORM 2004';
  if (xmlns?.includes('1.2')) return 'SCORM 1.2';
  
  return 'Unknown';
}

function xmlToObj(node: Node): any {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.nodeValue?.trim();
    return text ? { '#text': text } : undefined;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const obj: any = {};
    
    // Add attributes
    const attributes = (node as Element).attributes;
    for (let i = 0; i < attributes.length; i++) {
      const attr = attributes[i];
      obj[`$${attr.name}`] = attr.value;
    }
    
    // Add child nodes
    const children = node.childNodes;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childResult = xmlToObj(child);
      
      if (childResult !== undefined) {
        const name = child.nodeName;
        
        if (obj[name]) {
          if (!Array.isArray(obj[name])) {
            obj[name] = [obj[name]];
          }
          obj[name].push(childResult);
        } else {
          obj[name] = childResult;
        }
      }
    }
    
    return obj;
  }
  
  return undefined;
}