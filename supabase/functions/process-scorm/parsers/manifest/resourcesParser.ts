import { getNodeAttribute, getAllNodes } from '../xml/xmlParser.ts';
import type { Resource } from './types.ts';
import { logDebug } from '../../utils/logger.ts';

export function parseResources(resourcesNode: any): Resource[] {
  logDebug('Parsing resources from node:', resourcesNode);
  
  if (!resourcesNode) {
    logDebug('No resources node found');
    return [];
  }

  try {
    const resourceNodes = getAllNodes(resourcesNode, 'resource');
    logDebug(`Found ${resourceNodes.length} resource nodes`);

    const resources = resourceNodes.map(resource => {
      logDebug('Parsing resource:', resource);
      
      const parsed: Resource = {
        identifier: getNodeAttribute(resource, 'identifier') || '',
        type: getNodeAttribute(resource, 'type') || '',
        href: getNodeAttribute(resource, 'href'),
        scormType: getNodeAttribute(resource, 'adlcp:scormtype') || 
                  getNodeAttribute(resource, 'scormType'),
        files: parseFiles(resource)
      };

      logDebug('Parsed resource:', parsed);
      return parsed;
    });

    logDebug(`Successfully parsed ${resources.length} resources`);
    return resources;
  } catch (error) {
    logDebug('Error parsing resources:', error);
    return [];
  }
}

function parseFiles(resource: any): { href: string; type?: string }[] {
  const fileNodes = getAllNodes(resource, 'file');
  const files = fileNodes.map(file => ({
    href: getNodeAttribute(file, 'href') || '',
    type: getNodeAttribute(file, 'type')
  })).filter(file => file.href);
  
  logDebug(`Parsed ${files.length} files for resource`);
  return files;
}