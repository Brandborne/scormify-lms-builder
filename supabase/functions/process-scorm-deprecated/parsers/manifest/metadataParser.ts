import { getNodeText, getAllNodes } from '../xml/xmlParser.ts';
import type { MetadataResult } from '../../types/manifest.ts';
import { logDebug } from '../../utils/logger.ts';

export function parseMetadata(metadataNode: Element | null): MetadataResult {
  logDebug('Parsing metadata from node:', metadataNode);
  
  if (!metadataNode) {
    logDebug('No metadata node found');
    return {};
  }

  const lom = metadataNode.querySelector('lom\\:lom');
  if (!lom) {
    logDebug('No LOM metadata found');
    return {};
  }

  const result: MetadataResult = {
    schema: getNodeText(lom, 'lom\\:schema'),
    schemaVersion: getNodeText(lom, 'lom\\:schemaversion'),
    title: getNodeText(lom, 'lom\\:general lom\\:title lom\\:string'),
    description: getNodeText(lom, 'lom\\:general lom\\:description lom\\:string'),
    keywords: Array.from(lom.querySelectorAll('lom\\:general lom\\:keyword'))
      .map(k => getNodeText(k, 'lom\\:string'))
      .filter((k): k is string => !!k),
    version: getNodeText(lom, 'lom\\:lifecycle lom\\:version lom\\:string'),
    duration: getNodeText(lom, 'lom\\:technical lom\\:duration'),
    copyright: getNodeText(lom, 'lom\\:rights lom\\:copyrightAndOtherRestrictions lom\\:value')
  };

  // Remove undefined properties
  Object.keys(result).forEach(key => 
    result[key as keyof MetadataResult] === undefined && 
    delete result[key as keyof MetadataResult]
  );

  logDebug('Parsed metadata:', result);
  return result;
}