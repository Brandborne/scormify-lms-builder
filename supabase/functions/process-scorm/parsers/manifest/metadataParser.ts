import { getNodeText, getNodeAttribute, getAllNodes } from './xmlParser.ts';
import { MetadataResult } from '../types/manifest.ts';

export function parseMetadata(metadataNode: Element | null): MetadataResult {
  console.log('Parsing metadata from node:', metadataNode?.outerHTML);
  
  if (!metadataNode) {
    console.log('No metadata node found');
    return {};
  }

  // Try different metadata schema variations
  const title = 
    getNodeText(metadataNode, 'title') ||
    getNodeText(metadataNode, 'adlcp:title') ||
    getNodeText(metadataNode, 'imsmd:title') ||
    getNodeText(metadataNode, 'lom\\:title') ||
    getNodeText(metadataNode, 'general > title');

  const description = 
    getNodeText(metadataNode, 'description') ||
    getNodeText(metadataNode, 'adlcp:description') ||
    getNodeText(metadataNode, 'imsmd:description') ||
    getNodeText(metadataNode, 'lom\\:description') ||
    getNodeText(metadataNode, 'general > description');

  const result = {
    title,
    description,
    version: getNodeText(metadataNode, 'version')
  };

  // Remove undefined properties
  Object.keys(result).forEach(key => 
    result[key] === undefined && delete result[key]
  );

  console.log('Parsed metadata:', result);
  return result;
}