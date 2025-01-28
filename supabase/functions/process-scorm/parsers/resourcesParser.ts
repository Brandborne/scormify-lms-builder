import type { ResourceData } from '../types/parser.ts';

export function parseResources(resourcesNode: any): ResourceData[] {
  console.log('Parsing resources from node:', resourcesNode);
  
  if (!resourcesNode?.resource) {
    console.log('No resources found');
    return [];
  }

  const resources = Array.isArray(resourcesNode.resource) 
    ? resourcesNode.resource 
    : [resourcesNode.resource];

  const result = resources.map((resource: any) => {
    const parsed: ResourceData = {
      identifier: resource['$identifier'] || '',
      type: resource['$type'] || '',
      href: resource['$href'],
      scormType: resource['$adlcp:scormtype'] || resource['$adlcp:scormType'],
      files: parseFiles(resource.file),
      dependencies: parseDependencies(resource.dependency)
    };

    // Remove undefined properties
    Object.keys(parsed).forEach(key => 
      parsed[key] === undefined && delete parsed[key]
    );

    return parsed;
  });

  console.log('Parsed resources:', result);
  return result;
}

function parseFiles(files: any): string[] {
  if (!files) return [];
  
  const fileArray = Array.isArray(files) ? files : [files];
  return fileArray.map((file: any) => file['$href'] || '').filter(Boolean);
}

function parseDependencies(dependencies: any): string[] {
  if (!dependencies) return [];
  
  const depArray = Array.isArray(dependencies) ? dependencies : [dependencies];
  return depArray.map((dep: any) => dep['$identifierref']).filter(Boolean);
}