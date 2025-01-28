import { logDebug } from '../../utils/logger';
import { getNodeAttribute } from '../xml/xmlParser';

export function detectScormVersion(manifestElement: Element): string {
  logDebug('Detecting SCORM version from manifest element');
  
  const schemaVersion = getNodeAttribute(manifestElement, 'version');
  const xmlns = getNodeAttribute(manifestElement, 'xmlns');
  
  if (xmlns.includes('SCORM.2004')) {
    return 'SCORM 2004';
  } else if (xmlns.includes('SCORM.12')) {
    return 'SCORM 1.2';
  } else if (schemaVersion === '1.2') {
    return 'SCORM 1.2';
  } else if (schemaVersion.startsWith('2004')) {
    return 'SCORM 2004';
  }
  
  logDebug('Defaulting to SCORM 1.2');
  return 'SCORM 1.2';
}