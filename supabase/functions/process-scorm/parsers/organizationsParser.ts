export function parseOrganizations(organizationsNode: any) {
  if (!organizationsNode) {
    return { default: '', items: [] };
  }

  const defaultOrg = organizationsNode['$default'] || '';
  const organizations = organizationsNode.organization || [];

  const items = (Array.isArray(organizations) ? organizations : [organizations])
    .map(parseOrganizationItem)
    .filter(Boolean);

  return {
    default: defaultOrg,
    items
  };
}

function parseOrganizationItem(item: any) {
  if (!item) return null;

  const identifier = item['$identifier'] || '';
  const title = item.title?.[0]?.['#text'] || '';
  const description = item.description?.[0]?.['#text'];
  const resourceId = item['$identifierref'];

  const prerequisites = item['adlcp:prerequisites']?.map((prereq: any) => prereq['#text']).filter(Boolean);

  const children = item.item?.map((childItem: any) => parseOrganizationItem(childItem)).filter(Boolean);

  return {
    identifier,
    title,
    description,
    prerequisites: prerequisites?.length ? prerequisites : undefined,
    resourceId,
    children: children?.length ? children : undefined
  };
}