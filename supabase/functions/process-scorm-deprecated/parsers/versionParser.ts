export function detectScormVersion(manifest: any): string {
  console.log('Detecting SCORM version from manifest:', manifest);

  // Check metadata schema version first
  const schema = manifest.metadata?.[0]?.['lom:lom']?.[0]?.['lom:schema']?.[0]?.['#text'];
  if (schema) {
    console.log('Found schema in metadata:', schema);
    if (schema.includes('2004')) return 'SCORM 2004';
    if (schema.includes('1.2')) return 'SCORM 1.2';
  }
  
  // Check namespace attributes in manifest
  const xmlns = manifest['$xmlns'];
  if (xmlns) {
    console.log('Found xmlns attribute:', xmlns);
    if (xmlns.includes('2004')) return 'SCORM 2004';
    if (xmlns.includes('1.2')) return 'SCORM 1.2';
  }

  // Check for version-specific elements
  const hasScorm2004Elements = manifest['imsss:sequencing'] || 
                              manifest['adlseq:objectives'] ||
                              manifest['adlnav:presentation'];
  
  if (hasScorm2004Elements) {
    console.log('Found SCORM 2004 specific elements');
    return 'SCORM 2004';
  }

  console.log('No specific version indicators found, defaulting to SCORM 1.2');
  return 'SCORM 1.2';
}