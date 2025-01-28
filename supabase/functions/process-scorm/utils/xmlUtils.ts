/**
 * Utility functions for XML handling in SCORM manifest parsing
 */

const SCORM_NAMESPACES = {
  SCORM_12: 'http://www.adlnet.org/xsd/adlcp_rootv1p2',
  SCORM_2004: 'http://www.adlnet.org/xsd/adlcp_v1p3',
  LOM: 'http://ltsc.ieee.org/xsd/LOM',
  IMSSS: 'http://www.imsglobal.org/xsd/imsss',
  ADLSEQ: 'http://www.adlnet.org/xsd/adlseq_v1p3',
  ADLNAV: 'http://www.adlnet.org/xsd/adlnav_v1p3'
};

export function getNodeText(node: Element | null, selector: string): string | undefined {
  if (!node) return undefined;
  const element = node.querySelector(selector);
  return element?.textContent?.trim();
}

export function getNodeAttribute(node: Element | null, attribute: string): string | undefined {
  return node?.getAttribute(attribute)?.trim();
}

export function getAllNodes(node: Element | null, selector: string): Element[] {
  return node ? Array.from(node.querySelectorAll(selector)) : [];
}

export function hasNamespace(manifest: Element, namespace: string): boolean {
  return Array.from(manifest.attributes).some(attr => 
    attr.value.includes(namespace)
  );
}

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
    hasNamespace(manifest, SCORM_NAMESPACES.SCORM_2004) ||
    hasNamespace(manifest, SCORM_NAMESPACES.IMSSS) ||
    hasNamespace(manifest, SCORM_NAMESPACES.ADLSEQ) ||
    hasNamespace(manifest, SCORM_NAMESPACES.ADLNAV)
  ) {
    return 'SCORM 2004';
  }
  
  // Check for SCORM 1.2 indicators
  if (
    xmlns?.includes('1.2') || 
    schemaVersion?.includes('1.2') || 
    metadataSchema?.includes('1.2') ||
    manifest.querySelector('adlcp\\:masteryscore, masteryscore') || // SCORM 1.2 specific element
    hasNamespace(manifest, SCORM_NAMESPACES.SCORM_12)
  ) {
    return 'SCORM 1.2';
  }
  
  // Default to SCORM 1.2 if no specific version is detected
  console.warn('No explicit SCORM version found, defaulting to SCORM 1.2');
  return 'SCORM 1.2';
}

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