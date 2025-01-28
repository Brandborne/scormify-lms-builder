import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';

export function parseXML(xmlString: string): Document {
  console.log('Parsing XML string:', xmlString.substring(0, 200) + '...');
  
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  
  // Check for XML parsing errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    console.error('XML Parse Error:', parseError.textContent);
    throw new Error(`Invalid XML format in manifest: ${parseError.textContent}`);
  }

  if (!xmlDoc.documentElement) {
    console.error('No document element found in XML');
    throw new Error('Invalid XML: No document element found');
  }

  console.log('Successfully parsed XML document');
  return xmlDoc;
}

export function getNodeText(node: Element | null, selector: string): string | undefined {
  if (!node) {
    console.log(`Node not found for selector: ${selector}`);
    return undefined;
  }
  const element = node.querySelector(selector);
  const text = element?.textContent?.trim();
  console.log(`Getting text for selector "${selector}":`, text);
  return text;
}

export function getNodeAttribute(node: Element | null, attribute: string): string | undefined {
  if (!node) {
    console.log(`Node not found for attribute: ${attribute}`);
    return undefined;
  }
  const value = node.getAttribute(attribute)?.trim();
  console.log(`Getting attribute "${attribute}":`, value);
  return value;
}

export function getAllNodes(node: Element | null, selector: string): Element[] {
  if (!node) {
    console.log(`Parent node not found for selector: ${selector}`);
    return [];
  }
  const nodes = Array.from(node.querySelectorAll(selector));
  console.log(`Found ${nodes.length} nodes for selector "${selector}"`);
  return nodes;
}