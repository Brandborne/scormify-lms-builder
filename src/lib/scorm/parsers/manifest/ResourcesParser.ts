interface ResourceFile {
  href: string;
  type?: string;
}

interface Resource {
  identifier: string;
  type: string;
  href?: string;
  scormType?: string;
  files: ResourceFile[];
  dependencies?: string[];
}

export function parseResources(resourcesNode: any): Resource[] {
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

function parseFiles(files: any): ResourceFile[] {
  if (!files) return [];
  
  const fileArray = Array.isArray(files) ? files : [files];
  return fileArray.map((file: any) => ({
    href: file['$href'] || '',
    type: file['$type']
  }));
}

function parseDependencies(dependencies: any): string[] {
  if (!dependencies) return [];
  
  const depArray = Array.isArray(dependencies) ? dependencies : [dependencies];
  return depArray.map((dep: any) => dep['$identifierref']).filter(Boolean);
}