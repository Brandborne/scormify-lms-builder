import { XMLParser } from 'npm:fast-xml-parser';
import { ManifestData, ValidationResult } from '../types/manifest.ts';
import { logDebug } from '../utils/index.ts';

export function validateManifestXML(xmlString: string): ValidationResult {
  const errors: string[] = [];

  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });

    const result = parser.parse(xmlString);
    logDebug('Parsed XML:', result);

    if (!result.manifest) {
      errors.push('Missing required root element: manifest');
      return { isValid: false, errors };
    }

    if (!result.manifest['@_identifier']) {
      errors.push('Missing required attribute: manifest identifier');
    }

    if (!result.manifest.organizations) {
      errors.push('Missing required element: organizations');
    }

    if (!result.manifest.resources) {
      errors.push('Missing required element: resources');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    console.error('XML validation error:', error);
    errors.push('Failed to validate XML: ' + (error as Error).message);
    return { isValid: false, errors };
  }
}

export function parseManifestData(result: any): ManifestData {
  const manifest = result.manifest;
  
  if (!manifest) {
    throw new Error('Invalid manifest structure');
  }

  const organizations = parseOrganizations(manifest.organizations);
  const resources = parseResources(manifest.resources);
  const scormVersion = manifest.metadata?.schemaversion || 'SCORM 1.2';
  const startingPage = resources[0]?.href || '';

  return {
    identifier: manifest['@_identifier'] || '',
    version: manifest['@_version'] || '1',
    scormVersion,
    title: organizations.items[0]?.title || 'Untitled Course',
    status: 'processed',
    startingPage,
    organizations,
    resources
  };
}

function parseOrganizations(organizationsNode: any) {
  if (!organizationsNode?.organization) {
    return { default: '', items: [] };
  }

  const org = organizationsNode.organization;
  const defaultOrg = organizationsNode['@_default'] || '';

  const objectives = org.item?.['imsss:sequencing']?.['imsss:objectives'];
  const primaryObjective = objectives?.['imsss:primaryObjective'];
  const secondaryObjectives = objectives?.['imsss:objective'] || [];

  const organization = {
    identifier: org['@_identifier'] || '',
    title: org.title || '',
    objectives: primaryObjective || secondaryObjectives.length > 0 ? {
      primary: primaryObjective ? {
        id: primaryObjective['@_objectiveID'] || '',
        minScore: parseFloat(primaryObjective['imsss:minNormalizedMeasure'] || '0'),
        satisfiedByMeasure: primaryObjective['@_satisfiedByMeasure'] === 'true'
      } : undefined,
      secondary: Array.isArray(secondaryObjectives) 
        ? secondaryObjectives.map((obj: any) => ({ id: obj['@_objectiveID'] || '' }))
        : [{ id: secondaryObjectives['@_objectiveID'] || '' }]
    } : undefined
  };

  return {
    default: defaultOrg,
    items: [organization]
  };
}

function parseResources(resourcesNode: any) {
  if (!resourcesNode?.resource) {
    return [];
  }

  const resource = resourcesNode.resource;
  const files = resource.file || [];

  return [{
    identifier: resource['@_identifier'] || '',
    type: resource['@_type'] || '',
    scormType: resource['@_adlcp:scormType'] || '',
    href: resource['@_href'] || '',
    files: Array.isArray(files) 
      ? files.map((file: any) => ({ href: file['@_href'] || '' }))
      : [{ href: files['@_href'] || '' }]
  }];
}