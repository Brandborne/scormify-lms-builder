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