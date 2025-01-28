import { getNodeText, getNodeAttribute, getAllNodes } from '../utils/xmlUtils.ts';

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
  metadata?: {
    description?: string;
    requirements?: string[];
  };
}

export function parseResources(resourcesElement: Element | null): Resource[] {
  if (!resourcesElement) return [];

  return getAllNodes(resourcesElement, 'resource').map(resource => {
    const files = getAllNodes(resource, 'file').map(file => ({
      href: getNodeAttribute(file, 'href') || '',
      type: getNodeAttribute(file, 'type')
    }));

    const dependencies = getAllNodes(resource, 'dependency')
      .map(dep => getNodeAttribute(dep, 'identifierref'))
      .filter((id): id is string => id !== undefined);

    const metadata = resource.querySelector('metadata');
    const description = getNodeText(metadata, 'description string');
    const requirements = getAllNodes(metadata, 'requirement')
      .map(req => req.textContent || '')
      .filter(Boolean);

    return {
      identifier: getNodeAttribute(resource, 'identifier') || '',
      type: getNodeAttribute(resource, 'type') || '',
      href: getNodeAttribute(resource, 'href'),
      scormType: getNodeAttribute(resource, 'adlcp:scormtype') || getNodeAttribute(resource, 'scormtype'),
      files,
      dependencies: dependencies.length > 0 ? dependencies : undefined,
      metadata: (description || requirements.length > 0) ? {
        description,
        requirements: requirements.length > 0 ? requirements : undefined
      } : undefined
    };
  });
}