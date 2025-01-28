import { getNodeText } from './xmlParser.ts';

export function detectScormVersion(manifest: Element): string {
  console.log('Detecting SCORM version from manifest:', manifest.outerHTML);

  // Check metadata schema version first
  const schema = getNodeText(manifest, 'metadata schema') ||
                getNodeText(manifest, 'metadata > lom\\:lom > lom\\:schema');
  
  if (schema) {
    console.log('Found schema in metadata:', schema);
    if (schema.includes('2004')) return 'SCORM 2004';
    if (schema.includes('1.2')) return 'SCORM 1.2';
  }
  
  // Check namespace attributes
  const xmlns = manifest.getAttribute('xmlns');
  if (xmlns) {
    console.log('Found xmlns attribute:', xmlns);
    if (xmlns.includes('2004')) return 'SCORM 2004';
    if (xmlns.includes('1.2')) return 'SCORM 1.2';
  }

  // Check for version-specific elements
  const hasScorm2004Elements = 
    manifest.querySelector('imsss\\:sequencing') ||
    manifest.querySelector('adlseq\\:objectives') ||
    manifest.querySelector('adlnav\\:presentation');
  
  if (hasScorm2004Elements) {
    console.log('Found SCORM 2004 specific elements');
    return 'SCORM 2004';
  }

  console.log('No specific version indicators found, defaulting to SCORM 1.2');
  return 'SCORM 1.2';
}