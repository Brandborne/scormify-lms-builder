import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";
import { logDebug, logError } from "../../utils/logger.ts";

export function parseXML(xmlString: string): any {
  logDebug('Parsing XML string');
  
  try {
    const xmlDoc = parse(xmlString);
    if (!xmlDoc) {
      throw new Error('Failed to create XML document');
    }
    return xmlDoc;
  } catch (error) {
    logError('Error parsing XML:', error);
    throw error;
  }
}

export function getNodeText(node: any, selector: string): string | undefined {
  if (!node) return undefined;
  try {
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
    const results: any[] = [];
    
    function traverse(currentNode: any) {
      if (!currentNode) return;
      
      if (currentNode.name?.toLowerCase() === selector.toLowerCase()) {
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