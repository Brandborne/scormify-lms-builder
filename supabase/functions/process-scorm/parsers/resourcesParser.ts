export function parseResources(resourcesNode: any) {
  if (!resourcesNode?.resource) return [];

  const resources = Array.isArray(resourcesNode.resource) 
    ? resourcesNode.resource 
    : [resourcesNode.resource];

  return resources.map((resource: any) => ({
    identifier: resource['$identifier'] || '',
    type: resource['$type'] || '',
    href: resource['$href'],
    scormType: resource['$adlcp:scormtype'] || resource['$adlcp:scormType'],
    files: parseFiles(resource.file),
    dependencies: parseDependencies(resource.dependency)
  }));
}

function parseFiles(files: any) {
  if (!files) return [];
  
  const fileArray = Array.isArray(files) ? files : [files];
  return fileArray.map((file: any) => ({
    href: file['$href'] || '',
    type: file['$type']
  }));
}

function parseDependencies(dependencies: any) {
  if (!dependencies) return [];
  
  const depArray = Array.isArray(dependencies) ? dependencies : [dependencies];
  return depArray.map((dep: any) => dep['$identifierref']).filter(Boolean);
}