import { ResourceData } from '../types/manifest';

export function parseResources(resources: any[]): ResourceData[] {
  if (!Array.isArray(resources)) {
    resources = [resources];
  }

  return resources.map(resource => ({
    identifier: resource['$identifier'] || '',
    type: resource['$type'] || '',
    href: resource['$href'],
    scormType: resource['$adlcp:scormType'],
    files: parseFiles(resource.file)
  }));
}

function parseFiles(files: any): string[] {
  if (!files) return [];
  
  const fileArray = Array.isArray(files) ? files : [files];
  return fileArray.map(file => file['$href']).filter(Boolean);
}