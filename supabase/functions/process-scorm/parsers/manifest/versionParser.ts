import { getNodeText } from '../xml/xmlParser.ts';
import { logDebug } from '../../utils/logger.ts';

export function detectScormVersion(manifest: any): string {
  logDebug('Detecting SCORM version from manifest:', manifest);

  // Check metadata schema version first
  const schema = getNodeText(manifest, 'metadata schema') ||
                getNodeText(manifest, 'metadata > lom\\:lom > lom\\:schema');
  
  if (schema) {
    logDebug('Found schema in metadata:', schema);
    if (schema.includes('2004')) return 'SCORM 2004';
    if (schema.includes('1.2')) return 'SCORM 1.2';
  }
  
  // Check namespace attributes
  const xmlns = manifest.attributes?.['xmlns'];
  if (xmlns) {
    logDebug('Found xmlns attribute:', xmlns);
    if (xmlns.includes('2004')) return 'SCORM 2004';
    if (xmlns.includes('1.2')) return 'SCORM 1.2';
  }

  // Check for version-specific elements
  const hasScorm2004Elements = 
    manifest.querySelector('imsss\\:sequencing') ||
    manifest.querySelector('adlseq\\:objectives') ||
    manifest.querySelector('adlnav\\:presentation');
  
  if (hasScorm2004Elements) {
    logDebug('Found SCORM 2004 specific elements');
    return 'SCORM 2004';
  }

  logDebug('No specific version indicators found, defaulting to SCORM 1.2');
  return 'SCORM 1.2';
}