import { logDebug, logError } from '../../utils/logger.ts';

export function validateManifest(manifest: Element): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for required elements
  if (!manifest.querySelector('organizations')) {
    errors.push('Missing required element: organizations');
  }

  if (!manifest.querySelector('resources')) {
    errors.push('Missing required element: resources');
  }

  // Check for required attributes
  if (!manifest.getAttribute('identifier')) {
    errors.push('Missing required attribute: manifest identifier');
  }

  // Check for valid organization structure
  const organizations = manifest.querySelector('organizations');
  if (organizations) {
    const defaultOrg = organizations.getAttribute('default');
    const hasDefaultOrg = Array.from(organizations.querySelectorAll('organization'))
      .some(org => org.getAttribute('identifier') === defaultOrg);
    
    if (!hasDefaultOrg) {
      errors.push('Invalid organizations structure: default organization not found');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}