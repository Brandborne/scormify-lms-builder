import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

export function parseXML(xmlString: string): Document {
  console.log('Parsing XML string, length:', xmlString.length);
  console.log('First 500 chars:', xmlString.substring(0, 500));
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    
    if (!xmlDoc) {
      console.error('Failed to create XML document');
      throw new Error('Failed to create XML document');
    }

    // Check for XML parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      console.error('XML Parse Error:', parseError.textContent);
      throw new Error(`Invalid XML format: ${parseError.textContent}`);
    }

    console.log('Successfully parsed XML document');
    console.log('Root element:', xmlDoc.documentElement?.tagName);
    
    return xmlDoc;
  } catch (error) {
    console.error('Error in parseXML:', error);
    throw new Error(`XML parsing failed: ${error.message}`);
  }
}

export function getNodeText(node: Element | null, selector: string): string | undefined {
  if (!node) return undefined;
  try {
    const element = node.querySelector(selector);
    return element?.textContent?.trim();
  } catch (error) {
    console.error(`Error getting text for "${selector}":`, error);
    return undefined;
  }
}

export function getNodeAttribute(node: Element | null, attribute: string): string | undefined {
  if (!node) return undefined;
  try {
    return node.getAttribute(attribute)?.trim();
  } catch (error) {
    console.error(`Error getting attribute "${attribute}":`, error);
    return undefined;
  }
}

export function getAllNodes(node: Element | null, selector: string): Element[] {
  if (!node) return [];
  try {
    return Array.from(node.querySelectorAll(selector));
  } catch (error) {
    console.error(`Error getting nodes for "${selector}":`, error);
    return [];
  }
}