import { parseMetadata } from './MetadataParser';
import { parseOrganizations } from './OrganizationsParser';
import { parseResources } from './ResourcesParser';
import { parseSequencing } from './SequencingParser';
import { parseObjectives } from './ObjectivesParser';
import {
  ManifestData,
  MetadataResult,
  OrganizationsResult,
  Resource,
  SequencingData,
  ObjectiveData
} from './types';

export function parseManifest(manifestXml: string): ManifestData {
  console.log('Parsing manifest XML:', manifestXml);
  
  try {
    // Convert XML string to JavaScript object
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(manifestXml, 'text/xml');
    
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

export type { 
  MetadataResult,
  OrganizationsResult,
  Resource,
  SequencingData,
  ObjectiveData
};