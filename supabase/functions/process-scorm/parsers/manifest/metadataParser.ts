import { getNodeText } from '../xml/xmlParser.ts';
import type { MetadataResult } from '../../types/manifest.ts';
import { logDebug } from '../../utils/logger.ts';

export function parseMetadata(metadataNode: any): MetadataResult {
  logDebug('Parsing metadata from node:', metadataNode);
  
  if (!metadataNode) {
    logDebug('No metadata node found');
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

  logDebug('Parsed metadata:', result);
  return result;
}