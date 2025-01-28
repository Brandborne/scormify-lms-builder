import { parseMetadata } from '../metadataParser.ts';
import { parseOrganizations } from '../organizationsParser.ts';
import { parseResources } from '../resourcesParser.ts';
import { detectScormVersion, validateManifest } from '../utils/xmlUtils.ts';
import type { 
  MetadataResult,
  OrganizationsResult,
  Resource,
} from './types.ts';

export interface ManifestData {
  scormVersion: string;
  status: string;
  metadata: MetadataResult;
  organizations: OrganizationsResult;
  resources: Resource[];
}

export function parseManifest(manifestXml: string): ManifestData {
  console.log('Starting manifest parsing...');
  
  try {
    // Convert XML string to JavaScript object
    const parser = new DOMParser();
    const doc = parser.parseFromString(manifestXml, 'text/xml');
    
    if (!doc) {
      throw new Error('Failed to parse manifest XML');
    }

    const manifestElement = doc.querySelector('manifest');
    if (!manifestElement) {
      throw new Error('Invalid manifest: No manifest element found');
    }

    // Validate manifest structure
    const validation = validateManifest(manifestElement);
    if (!validation.isValid) {
      console.warn('Manifest validation warnings:', validation.errors);
    }

    console.log('Manifest element found, detecting SCORM version...');
    const scormVersion = detectScormVersion(manifestElement);
    console.log('Detected SCORM version:', scormVersion);

    // Parse main sections
    const metadata = parseMetadata(manifestElement.querySelector('metadata'));
    const organizations = parseOrganizations(manifestElement.querySelector('organizations'));
    const resources = parseResources(manifestElement.querySelector('resources'));

    const result: ManifestData = {
      scormVersion,
      status: 'processed',
      metadata,
      organizations,
      resources
    };

    console.log('Successfully parsed manifest:', result);
    return result;

  } catch (error) {
    console.error('Error parsing manifest:', error);
    throw new Error(`Failed to parse manifest: ${error.message}`);
  }
}

export type { 
  MetadataResult,
  OrganizationsResult,
  Resource
};