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
  learningObjectives?: string[];
  technicalRequirements?: {
    type?: string;
    name?: string;
    minimumVersion?: string;
    maximumVersion?: string;
  }[];
}

export function parseMetadata(metadataElement: Element | null): MetadataResult {
  if (!metadataElement) return {};

  const lom = metadataElement.querySelector('lom\\:lom, lom');
  if (!lom) return {};

  const general = lom.querySelector('lom\\:general, general');
  const technical = lom.querySelector('lom\\:technical, technical');
  const rights = lom.querySelector('lom\\:rights, rights');
  const lifecycle = lom.querySelector('lom\\:lifecycle, lifecycle');
  const educational = lom.querySelector('lom\\:educational, educational');

  // Parse learning objectives
  const learningObjectives = getAllNodes(educational, 'lom\\:learningResourceType string, learningResourceType string')
    .map(node => node.textContent?.trim())
    .filter((text): text is string => !!text);

  // Parse technical requirements
  const technicalRequirements = getAllNodes(technical, 'lom\\:requirement, requirement')
    .map(req => ({
      type: getNodeText(req, 'lom\\:type value, type value'),
      name: getNodeText(req, 'lom\\:name value, name value'),
      minimumVersion: getNodeText(req, 'lom\\:minimumVersion, minimumVersion'),
      maximumVersion: getNodeText(req, 'lom\\:maximumVersion, maximumVersion')
    }));

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
    copyright: getNodeText(rights, 'lom\\:description string, description string'),
    learningObjectives,
    technicalRequirements
  };
}