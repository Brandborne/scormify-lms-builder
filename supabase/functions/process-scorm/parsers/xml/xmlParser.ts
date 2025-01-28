import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";
import { logDebug, logError } from "../../utils/logger.ts";
import { ScormError } from "../../utils/errorHandler.ts";

export function parseXML(xmlString: string): any {
  logDebug('Parsing XML string, length:', xmlString.length);
  logDebug('First 500 chars:', xmlString.substring(0, 500));
  
  try {
    const xmlDoc = parse(xmlString);
    
    if (!xmlDoc) {
      logError('Failed to create XML document');
      throw new ScormError(
        'Failed to create XML document',
        'XML_PARSE_ERROR'
      );
    }

    logDebug('Successfully parsed XML document');
    logDebug('Root element:', xmlDoc.root?.name);
    
    return xmlDoc;
  } catch (error) {
    logError('Error in parseXML:', error);
    throw new ScormError(
      `XML parsing failed: ${error.message}`,
      'XML_PARSE_ERROR',
      { originalError: error }
    );
  }
}

export function getNodeText(node: any, selector: string): string | undefined {
  if (!node) return undefined;
  try {
    // Split selector by '>' to handle nested elements
    const parts = selector.split('>').map(p => p.trim());
    let current = node;
    
    for (const part of parts) {
      current = current.children?.find((child: any) => 
        child.name?.toLowerCase() === part.toLowerCase()
      );
      if (!current) return undefined;
    }
    
    return current.content?.trim();
  } catch (error) {
    logError(`Error getting text for "${selector}":`, error);
    return undefined;
  }
}

export function getNodeAttribute(node: any, attribute: string): string | undefined {
  if (!node) return undefined;
  try {
    return node.attributes?.[attribute]?.trim();
  } catch (error) {
    logError(`Error getting attribute "${attribute}":`, error);
    return undefined;
  }
}

export function getAllNodes(node: any, selector: string): any[] {
  if (!node) return [];
  try {
    // Split selector by ',' to handle multiple selectors
    const selectors = selector.split(',').map(s => s.trim());
    const results: any[] = [];
    
    function traverse(currentNode: any) {
      if (!currentNode) return;
      
      if (selectors.some(sel => 
        currentNode.name?.toLowerCase() === sel.toLowerCase()
      )) {
        results.push(currentNode);
      }
      
      if (currentNode.children) {
        currentNode.children.forEach((child: any) => traverse(child));
      }
    }
    
    traverse(node);
    return results;
  } catch (error) {
    logError(`Error getting nodes for "${selector}":`, error);
    return [];
  }
}

export function validateManifest(manifest: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for required elements
  if (!getAllNodes(manifest, 'organizations').length) {
    errors.push('Missing required element: organizations');
  }

  if (!getAllNodes(manifest, 'resources').length) {
    errors.push('Missing required element: resources');
  }

  // Check for required attributes
  if (!getNodeAttribute(manifest, 'identifier')) {
    errors.push('Missing required attribute: manifest identifier');
  }

  // Check for valid organization structure
  const organizations = getAllNodes(manifest, 'organizations')[0];
  if (organizations) {
    const defaultOrg = getNodeAttribute(organizations, 'default');
    const hasDefaultOrg = getAllNodes(organizations, 'organization')
      .some(org => getNodeAttribute(org, 'identifier') === defaultOrg);
    
    if (!hasDefaultOrg) {
      errors.push('Invalid organizations structure: default organization not found');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}