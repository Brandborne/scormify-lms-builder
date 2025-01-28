import type { Resource, ResourceFile } from '../../types/manifest.ts';
import { logDebug } from '../../utils/logger.ts';

export function parseResources(resourcesNode: Element | null): Resource[] {
  if (!resourcesNode) return [];

  const resources = Array.from(resourcesNode.querySelectorAll('resource'));

  return resources.map(resource => ({
    identifier: resource.getAttribute('identifier') || '',
    type: resource.getAttribute('type') || '',
    href: resource.getAttribute('href'),
    scormType: resource.getAttribute('adlcp:scormtype') || resource.getAttribute('adlcp:scormType'),
    files: parseFiles(resource),
    dependencies: parseDependencies(resource)
  }));
}

function parseFiles(resource: Element): ResourceFile[] {
  const files = Array.from(resource.querySelectorAll('file'));
  
  return files.map(file => ({
    href: file.getAttribute('href') || '',
    type: file.getAttribute('type')
  }));
}

function parseDependencies(resource: Element): string[] {
  const dependencies = Array.from(resource.querySelectorAll('dependency'));
  return dependencies
    .map(dep => dep.getAttribute('identifierref'))
    .filter((id): id is string => !!id);
}