export function detectScormVersion(manifest: any): string {
  // Check metadata schema version first
  const schema = manifest.metadata?.[0]?.['lom:lom']?.[0]?.['lom:schema']?.[0]?.['#text'];
  if (schema) {
    if (schema.includes('2004')) return 'SCORM 2004';
    if (schema.includes('1.2')) return 'SCORM 1.2';
  }
  
  // Check namespace attributes in manifest
  const xmlns = manifest['$xmlns'];
  if (xmlns) {
    if (xmlns.includes('2004')) return 'SCORM 2004';
    if (xmlns.includes('1.2')) return 'SCORM 1.2';
  }

  // Check for version-specific elements
  const hasScorm2004Elements = manifest['imsss:sequencing'] || 
                              manifest['adlseq:objectives'] ||
                              manifest['adlnav:presentation'];
  
  if (hasScorm2004Elements) return 'SCORM 2004';

  // Default to 1.2 if no specific version indicators found
  return 'SCORM 1.2';
}