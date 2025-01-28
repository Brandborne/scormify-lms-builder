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

  return Array.from(resourcesElement.querySelectorAll('resource')).map(resource => {
    const files = Array.from(resource.querySelectorAll('file')).map(file => ({
      href: file.getAttribute('href') || '',
      type: file.getAttribute('type')
    }));

    const dependencies = Array.from(resource.querySelectorAll('dependency'))
      .map(dep => dep.getAttribute('identifierref'))
      .filter((id): id is string => id !== null);

    const metadata = resource.querySelector('metadata');
    const description = metadata?.querySelector('description string')?.textContent;
    const requirements = Array.from(metadata?.querySelectorAll('requirement') || [])
      .map(req => req.textContent || '')
      .filter(Boolean);

    return {
      identifier: resource.getAttribute('identifier') || '',
      type: resource.getAttribute('type') || '',
      href: resource.getAttribute('href'),
      scormType: resource.getAttribute('adlcp:scormtype') || resource.getAttribute('scormtype'),
      files,
      dependencies: dependencies.length > 0 ? dependencies : undefined,
      metadata: (description || requirements.length > 0) ? {
        description,
        requirements: requirements.length > 0 ? requirements : undefined
      } : undefined
    };
  });
}