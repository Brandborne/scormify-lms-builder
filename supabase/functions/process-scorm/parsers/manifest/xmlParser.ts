import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';

export function parseXML(xmlString: string): Document {
  console.log('Parsing XML string, length:', xmlString.length);
  console.log('First 500 chars:', xmlString.substring(0, 500));
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
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

    if (!xmlDoc.documentElement) {
      console.error('No document element found in XML');
      throw new Error('Invalid XML: No document element found');
    }

    // Log successful parsing
    console.log('Successfully parsed XML document');
    console.log('Root element:', xmlDoc.documentElement.tagName);
    console.log('Root attributes:', Array.from(xmlDoc.documentElement.attributes)
      .map(attr => `${attr.name}=${attr.value}`));

    return xmlDoc;
  } catch (error) {
    console.error('Error in parseXML:', error);
    throw new Error(`XML parsing failed: ${error.message}`);
  }
}

export function getNodeText(node: Element | null, selector: string): string | undefined {
  if (!node) {
    console.log(`Node not found for selector: ${selector}`);
    return undefined;
  }

  try {
    const element = node.querySelector(selector);
    const text = element?.textContent?.trim();
    console.log(`Getting text for "${selector}":`, text);
    return text;
  } catch (error) {
    console.error(`Error getting text for "${selector}":`, error);
    return undefined;
  }
}

export function getNodeAttribute(node: Element | null, attribute: string): string | undefined {
  if (!node) {
    console.log(`Node not found for attribute: ${attribute}`);
    return undefined;
  }

  try {
    const value = node.getAttribute(attribute)?.trim();
    console.log(`Getting attribute "${attribute}":`, value);
    return value;
  } catch (error) {
    console.error(`Error getting attribute "${attribute}":`, error);
    return undefined;
  }
}

export function getAllNodes(node: Element | null, selector: string): Element[] {
  if (!node) {
    console.log(`Parent node not found for selector: ${selector}`);
    return [];
  }

  try {
    const nodes = Array.from(node.querySelectorAll(selector));
    console.log(`Found ${nodes.length} nodes for "${selector}"`);
    return nodes;
  } catch (error) {
    console.error(`Error getting nodes for "${selector}":`, error);
    return [];
  }
}