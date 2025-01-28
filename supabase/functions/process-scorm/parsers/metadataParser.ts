import type { MetadataResult } from '../types/parser.ts';

export function parseMetadata(metadataNode: any): MetadataResult {
  console.log('Parsing metadata from node:', metadataNode);
  
  if (!metadataNode) {
    console.log('No metadata node found');
    return {};
  }

  const lom = metadataNode['lom:lom']?.[0];
  if (!lom) {
    console.log('No LOM data found in metadata');
    return {};
  }

  const result: MetadataResult = {
    schema: lom['lom:schema']?.[0]?.['#text'],
    schemaVersion: lom['lom:schemaversion']?.[0]?.['#text'],
    title: lom['lom:general']?.[0]?.['lom:title']?.[0]?.['lom:string']?.[0]?.['#text'],
    description: lom['lom:general']?.[0]?.['lom:description']?.[0]?.['lom:string']?.[0]?.['#text'],
    keywords: lom['lom:general']?.[0]?.['lom:keyword']?.map((k: any) => k['lom:string']?.[0]?.['#text']),
    version: lom['lom:lifecycle']?.[0]?.['lom:version']?.[0]?.['lom:string']?.[0]?.['#text'],
    duration: lom['lom:technical']?.[0]?.['lom:duration']?.[0]?.['#text'],
    copyright: lom['lom:rights']?.[0]?.['lom:copyrightAndOtherRestrictions']?.[0]?.['lom:value']?.[0]?.['#text']
  };

  console.log('Parsed metadata:', result);
  return result;
}