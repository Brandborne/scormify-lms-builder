import { logDebug, logError } from '../../utils/logger.ts';

export function parseXML(xmlString: string) {
  logDebug('Parsing XML string');
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      throw new Error('XML parsing error');
    }
    
    return xmlDoc;
  } catch (error) {
    logError('Error parsing XML:', error);
    throw error;
  }
}

export function getNodeText(node: Element | null, selector: string): string | undefined {
  if (!node) return undefined;
  const element = node.querySelector(selector);
  return element?.textContent?.trim();
}

export function getAllNodes(node: Element | null, selector: string): Element[] {
  return node ? Array.from(node.querySelectorAll(selector)) : [];
}