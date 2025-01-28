import type { MetadataResult } from '../types/parser.ts';

export function parseMetadata(metadataNode: any): MetadataResult {
  console.log('Parsing metadata from node:', metadataNode);
  
  if (!metadataNode) {
    console.log('No metadata node found');
    return {};
  }

  const lom = metadataNode['lom:lom']?.[0] || {};
  const general = lom['lom:general']?.[0] || {};
  const technical = lom['lom:technical']?.[0] || {};
  const rights = lom['lom:rights']?.[0] || {};

  const result: MetadataResult = {
    schema: lom['lom:schema']?.[0]?.['#text'],
    schemaVersion: lom['lom:schemaversion']?.[0]?.['#text'],
    title: general['lom:title']?.[0]?.['lom:string']?.[0]?.['#text'],
    description: general['lom:description']?.[0]?.['lom:string']?.[0]?.['#text'],
    keywords: general['lom:keyword']?.map((k: any) => 
      k['lom:string']?.[0]?.['#text']
    ).filter(Boolean),
    version: lom['lom:lifecycle']?.[0]?.['lom:version']?.[0]?.['lom:string']?.[0]?.['#text'],
    duration: technical['lom:duration']?.[0]?.['#text'],
    copyright: rights['lom:copyrightAndOtherRestrictions']?.[0]?.['lom:value']?.[0]?.['#text']
  };

  // Remove undefined properties
  Object.keys(result).forEach(key => 
    result[key] === undefined && delete result[key]
  );

  console.log('Parsed metadata:', result);
  return result;
}