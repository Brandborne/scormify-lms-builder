import { hasNamespace } from '../utils/xmlUtils.ts';

export function detectScormVersion(manifest: Element): string {
  // Check schema definition
  const schemaVersion = manifest.getAttribute('version');
  const xmlns = manifest.getAttribute('xmlns');
  const metadataSchema = manifest.querySelector('schema')?.textContent;
  
  // Check for SCORM 2004 indicators
  if (
    xmlns?.includes('2004') || 
    schemaVersion?.includes('2004') || 
    metadataSchema?.includes('2004') ||
    manifest.querySelector('imsss\\:sequencing, sequencing') || // SCORM 2004 specific element
    manifest.querySelector('adlseq\\:objectives, objectives') || // SCORM 2004 specific element
    manifest.querySelector('adlnav\\:presentation, presentation') || // SCORM 2004 specific element
    hasNamespace(manifest, 'adlseq') ||
    hasNamespace(manifest, 'imsss') ||
    hasNamespace(manifest, 'adlnav')
  ) {
    return 'SCORM 2004';
  }
  
  // Check for SCORM 1.2 indicators
  if (
    xmlns?.includes('1.2') || 
    schemaVersion?.includes('1.2') || 
    metadataSchema?.includes('1.2') ||
    manifest.querySelector('adlcp\\:masteryscore, masteryscore') || // SCORM 1.2 specific element
    hasNamespace(manifest, 'adlcp')
  ) {
    return 'SCORM 1.2';
  }
  
  // Default to SCORM 1.2 if no specific version is detected
  console.warn('No explicit SCORM version found, defaulting to SCORM 1.2');
  return 'SCORM 1.2';
}