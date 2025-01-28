import { parse as parseXML } from 'https://deno.land/x/xml@2.1.1/mod.ts';
import { parseMetadata } from './parsers/metadataParser.ts';
import { parseOrganizations } from './parsers/organizationsParser.ts';
import { parseResources } from './parsers/resourcesParser.ts';
import { parseSequencing } from './parsers/sequencingParser.ts';
import { detectScormVersion } from './parsers/versionParser.ts';
import type { ManifestResult } from './types/parser.ts';

export async function parseManifest(manifestContent: string): Promise<ManifestResult> {
  console.log('Starting manifest parsing with content length:', manifestContent.length);
  
  try {
    console.log('Raw manifest content:', manifestContent);
    const xmlObj = parseXML(manifestContent);
    console.log('XML parsing successful, manifest structure:', JSON.stringify(xmlObj, null, 2));

    if (!xmlObj || !xmlObj.manifest) {
      throw new Error('Invalid manifest: No manifest element found');
    }

    const manifest = xmlObj.manifest[0] || xmlObj.manifest;
    console.log('Processing manifest element:', JSON.stringify(manifest, null, 2));
    
    // Parse and log SCORM version
    const scormVersion = detectScormVersion(manifest);
    console.log('Detected SCORM version:', scormVersion);

    // Parse and log metadata
    console.log('Parsing metadata from:', JSON.stringify(manifest.metadata?.[0], null, 2));
    const metadata = parseMetadata(manifest.metadata?.[0]);
    console.log('Parsed metadata result:', JSON.stringify(metadata, null, 2));

    // Parse and log organizations
    console.log('Parsing organizations from:', JSON.stringify(manifest.organizations?.[0], null, 2));
    const organizations = parseOrganizations(manifest.organizations?.[0]);
    console.log('Parsed organizations result:', JSON.stringify(organizations, null, 2));

    // Parse and log resources
    console.log('Parsing resources from:', JSON.stringify(manifest.resources?.[0], null, 2));
    const resources = parseResources(manifest.resources?.[0]);
    console.log('Parsed resources result:', JSON.stringify(resources, null, 2));

    // Parse and log sequencing
    console.log('Parsing sequencing from:', JSON.stringify(manifest['imsss:sequencing']?.[0], null, 2));
    const sequencing = parseSequencing(manifest['imsss:sequencing']?.[0]);
    console.log('Parsed sequencing result:', JSON.stringify(sequencing, null, 2));

    // Find starting page from resources
    const startingPage = resources.find(r => 
      r.scormType?.toLowerCase() === 'sco' && r.href
    )?.href || resources[0]?.href;
    console.log('Identified starting page:', startingPage);

    // Get prerequisites from organizations
    const prerequisites = organizations.items
      .flatMap(item => item.prerequisites || [])
      .filter(Boolean);
    console.log('Extracted prerequisites:', prerequisites);

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
      sequencing: Object.keys(sequencing).length > 0 ? sequencing : undefined
    };

    console.log('Final manifest parsing result:', JSON.stringify(result, null, 2));
    return result;

  } catch (error) {
    console.error('Error parsing manifest:', error);
    console.error('Error stack:', error.stack);
    throw new Error(`Failed to parse manifest: ${error.message}`);
  }
}