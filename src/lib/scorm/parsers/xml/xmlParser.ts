import { logDebug, logError } from '../../utils/logger';

export function parseXML(xmlString: string) {
  logDebug('Parsing XML string:', xmlString.substring(0, 100) + '...');
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      throw new Error('XML parsing error');
    }
    
    return {
      root: xmlDoc.documentElement,
      getElementsByTagName: (tagName: string) => xmlDoc.getElementsByTagName(tagName),
      querySelector: (selector: string) => xmlDoc.querySelector(selector)
    };
  } catch (error) {
    logError('Error parsing XML:', error);
    throw error;
  }
}

export function getNodeText(node: Element | null): string {
  if (!node) return '';
  return node.textContent || '';
}

export function getNodeAttribute(node: Element | null, attributeName: string): string {
  if (!node) return '';
  return node.getAttribute(attributeName) || '';
}

export function getAllNodes(node: Element | null, tagName: string): Element[] {
  if (!node) return [];
  return Array.from(node.getElementsByTagName(tagName));
}