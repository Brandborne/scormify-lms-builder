export function parseResources(resourcesNode: any) {
  if (!resourcesNode?.resource) {
    return [];
  }

  const resource = resourcesNode.resource;
  const files = resource.file || [];

  return [{
    identifier: resource['@_identifier'] || '',
    type: resource['@_type'] || '',
    scormType: resource['@_adlcp:scormType'] || '',
    href: resource['@_href'] || '',
    files: Array.isArray(files) 
      ? files.map(file => ({ href: file['@_href'] || '' }))
      : [{ href: files['@_href'] || '' }]
  }];
}