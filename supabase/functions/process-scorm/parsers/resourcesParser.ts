import type { ResourceData } from '../types/parser.ts';

export function parseResources(resourcesNode: any): ResourceData[] {
  console.log('Parsing resources from node:', JSON.stringify(resourcesNode, null, 2));
  
  if (!resourcesNode?.resource) {
    console.log('No resources found');
    return [];
  }

  const resources = Array.isArray(resourcesNode.resource) 
    ? resourcesNode.resource 
    : [resourcesNode.resource];

  const result = resources.map((resource: any) => {
    console.log('Parsing resource:', JSON.stringify(resource, null, 2));
    
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

    console.log('Parsed resource:', JSON.stringify(parsed, null, 2));
    return parsed;
  });

  console.log('Parsed resources:', JSON.stringify(result, null, 2));
  return result;
}

function parseFiles(files: any): string[] {
  console.log('Parsing files:', JSON.stringify(files, null, 2));
  
  if (!files) return [];
  
  const fileArray = Array.isArray(files) ? files : [files];
  const result = fileArray.map((file: any) => file['$href'] || '').filter(Boolean);
  
  console.log('Parsed files:', result);
  return result;
}

function parseDependencies(dependencies: any): string[] {
  console.log('Parsing dependencies:', JSON.stringify(dependencies, null, 2));
  
  if (!dependencies) return [];
  
  const depArray = Array.isArray(dependencies) ? dependencies : [dependencies];
  const result = depArray.map((dep: any) => dep['$identifierref']).filter(Boolean);
  
  console.log('Parsed dependencies:', result);
  return result;
}