import { getNodeAttribute, getAllNodes } from './xmlParser.ts';
import type { ResourceData } from '../../types/parser.ts';

export function parseResources(resourcesNode: Element | null): ResourceData[] {
  console.log('Parsing resources from node:', resourcesNode?.outerHTML);
  
  if (!resourcesNode) {
    console.log('No resources node found');
    return [];
  }

  try {
    const resourceNodes = getAllNodes(resourcesNode, 'resource');
    console.log(`Found ${resourceNodes.length} resource nodes`);

    const resources = resourceNodes.map(resource => {
      console.log('Parsing resource:', resource.outerHTML);
      
      const parsed: ResourceData = {
        identifier: getNodeAttribute(resource, 'identifier') || '',
        type: getNodeAttribute(resource, 'type') || '',
        href: getNodeAttribute(resource, 'href'),
        scormType: getNodeAttribute(resource, 'adlcp:scormtype') || 
                  getNodeAttribute(resource, 'scormType'),
        files: parseFiles(resource)
      };

      console.log('Parsed resource:', parsed);
      return parsed;
    });

    console.log(`Successfully parsed ${resources.length} resources`);
    return resources;
  } catch (error) {
    console.error('Error parsing resources:', error);
    return [];
  }
}

function parseFiles(resource: Element): string[] {
  const fileNodes = getAllNodes(resource, 'file');
  const files = fileNodes
    .map(file => getNodeAttribute(file, 'href'))
    .filter(Boolean) as string[];
  
  console.log(`Parsed ${files.length} files for resource`);
  return files;
}