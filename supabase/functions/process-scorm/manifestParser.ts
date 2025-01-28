import { parseManifest } from '../../../src/lib/scorm/parsers/manifest/index.ts';

export async function parseManifestFile(manifestContent: string) {
  console.log('Processing manifest content:', manifestContent);
  
  try {
    const manifestData = parseManifest(manifestContent);
    console.log('Parsed manifest data:', manifestData);
    return manifestData;
  } catch (error) {
    console.error('Error parsing manifest:', error);
    throw new Error(`Failed to parse manifest: ${error.message}`);
  }
}