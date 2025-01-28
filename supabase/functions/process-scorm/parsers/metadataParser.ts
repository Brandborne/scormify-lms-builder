import { getNodeText, getAllNodes } from '../utils/xmlUtils.ts';

interface MetadataResult {
  schema?: string;
  schemaVersion?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  version?: string;
  duration?: string;
  copyright?: string;
}

export function parseMetadata(metadataElement: Element | null): MetadataResult {
  if (!metadataElement) return {};

  const lom = metadataElement.querySelector('lom\\:lom, lom');
  if (!lom) return {};

  const general = lom.querySelector('lom\\:general, general');
  const technical = lom.querySelector('lom\\:technical, technical');
  const rights = lom.querySelector('lom\\:rights, rights');
  const lifecycle = lom.querySelector('lom\\:lifecycle, lifecycle');

  return {
    schema: getNodeText(lom, 'lom\\:schema, schema'),
    schemaVersion: getNodeText(lom, 'lom\\:schemaversion, schemaversion'),
    title: getNodeText(general, 'lom\\:title string, title string'),
    description: getNodeText(general, 'lom\\:description string, description string'),
    keywords: getAllNodes(general, 'lom\\:keyword string, keyword string')
      .map(node => node.textContent?.trim())
      .filter((text): text is string => !!text),
    version: getNodeText(lifecycle, 'lom\\:version string, version string'),
    duration: getNodeText(technical, 'lom\\:duration, duration'),
    copyright: getNodeText(rights, 'lom\\:description string, description string')
  };
}