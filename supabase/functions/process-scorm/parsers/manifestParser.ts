import { parseOrganizations } from './organizationsParser.ts';
import { parseResources } from './resourcesParser.ts';
import { ManifestData } from '../types.ts';

export function parseManifestData(result: any): ManifestData {
  const manifest = result.manifest;
  
  if (!manifest) {
    throw new Error('Invalid manifest structure');
  }

  const organizations = parseOrganizations(manifest.organizations);
  const resources = parseResources(manifest.resources);
  
  // Determine SCORM version from metadata or schema
  const scormVersion = manifest.metadata?.schemaversion || 'SCORM 1.2';
  
  // Find starting page from resources
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