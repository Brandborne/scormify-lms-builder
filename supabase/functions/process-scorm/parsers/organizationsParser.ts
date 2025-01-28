export function parseOrganizations(organizationsNode: any): any {
  console.log('Parsing organizations from node:', JSON.stringify(organizationsNode, null, 2));
  
  if (!organizationsNode) {
    console.log('No organizations node found');
    return { default: '', items: [] };
  }

  const defaultOrg = organizationsNode['@default'] || '';
  const organizations = organizationsNode['organization'] || [];

  const items = (Array.isArray(organizations) ? organizations : [organizations])
    .map(parseOrganizationItem)
    .filter(Boolean);

  const result = {
    default: defaultOrg,
    items
  };

  console.log('Parsed organizations:', JSON.stringify(result, null, 2));
  return result;
}

function parseOrganizationItem(item: any): any {
  console.log('Parsing organization item:', JSON.stringify(item, null, 2));
  
  if (!item) return null;

  const identifier = item['@identifier'] || '';
  const title = item['title']?.[0]?.['#text'] || '';
  const resourceId = item['@identifierref'];

  // Handle both namespaced and non-namespaced prerequisites
  const prerequisites = item['adlcp:prerequisites']?.map((prereq: any) => 
    prereq['#text']
  ).filter(Boolean);

  const children = item['item']?.map((childItem: any) => 
    parseOrganizationItem(childItem)
  ).filter(Boolean);

  const result = {
    identifier,
    title,
    prerequisites: prerequisites?.length ? prerequisites : undefined,
    resourceId,
    children: children?.length ? children : undefined
  };

  console.log('Parsed organization item:', JSON.stringify(result, null, 2));
  return result;
}