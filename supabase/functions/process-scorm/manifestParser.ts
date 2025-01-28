import { parse as parseXML } from 'https://deno.land/x/xml@2.1.1/mod.ts';
import { parseMetadata } from './parsers/metadataParser.ts';
import { parseOrganizations } from './parsers/organizationsParser.ts';
import { parseResources } from './parsers/resourcesParser.ts';
import { parseSequencing } from './parsers/sequencingParser.ts';
import { detectScormVersion } from './parsers/versionParser.ts';
import type { ManifestResult } from './types/parser.ts';

export async function parseManifest(manifestContent: string): Promise<ManifestResult> {
  console.log('Starting manifest parsing...');
  
  try {
    const xmlObj = parseXML(manifestContent);
    console.log('Successfully parsed XML:', xmlObj);

    if (!xmlObj || !xmlObj.manifest) {
      throw new Error('Invalid manifest: No manifest element found');
    }

    const manifest = xmlObj.manifest[0] || xmlObj.manifest;
    console.log('Manifest element found, detecting SCORM version...');
    
    const scormVersion = detectScormVersion(manifest);
    console.log('Detected SCORM version:', scormVersion);

    const metadata = parseMetadata(manifest.metadata?.[0]);
    const organizations = parseOrganizations(manifest.organizations?.[0]);
    const resources = parseResources(manifest.resources?.[0]);
    const sequencing = parseSequencing(manifest['imsss:sequencing']?.[0]);

    // Find starting page from resources
    const startingPage = resources.find(r => 
      r.scormType?.toLowerCase() === 'sco' && r.href
    )?.href || resources[0]?.href;

    // Get prerequisites from organizations
    const prerequisites = organizations.items
      .flatMap(item => item.prerequisites || [])
      .filter(Boolean);

    const result: ManifestResult = {
      title: organizations.items[0]?.title || metadata.title || 'Untitled Course',
      version: metadata.schemaVersion,
      scormVersion,
      status: 'processed',
      startingPage,
      prerequisites: prerequisites.length > 0 ? prerequisites : undefined,
      metadata,
      organizations,
      resources,
      sequencing
    };

    console.log('Successfully parsed manifest:', result);
    return result;

  } catch (error) {
    console.error('Error parsing manifest:', error);
    throw new Error(`Failed to parse manifest: ${error.message}`);
  }
}