import type { OrganizationsResult, OrganizationItem } from '../types/parser.ts';

export function parseOrganizations(organizationsNode: any): OrganizationsResult {
  console.log('Parsing organizations from node:', organizationsNode);
  
  if (!organizationsNode) {
    console.log('No organizations node found');
    return { default: '', items: [] };
  }

  const defaultOrg = organizationsNode['$default'] || '';
  const organizations = organizationsNode.organization || [];

  const items = (Array.isArray(organizations) ? organizations : [organizations])
    .map(parseOrganizationItem)
    .filter(Boolean);

  const result: OrganizationsResult = {
    default: defaultOrg,
    items
  };

  console.log('Parsed organizations:', result);
  return result;
}

function parseOrganizationItem(item: any): OrganizationItem | null {
  if (!item) return null;

  const identifier = item['$identifier'] || '';
  const title = item.title?.[0]?.['#text'] || '';
  const description = item.description?.[0]?.['#text'];
  const resourceId = item['$identifierref'];

  const prerequisites = item['adlcp:prerequisites']?.map((prereq: any) => prereq['#text']).filter(Boolean);

  const children = item.item?.map((childItem: any) => parseOrganizationItem(childItem)).filter(Boolean);

  const result: OrganizationItem = {
    identifier,
    title,
    description,
    prerequisites: prerequisites?.length ? prerequisites : undefined,
    resourceId,
    children: children?.length ? children : undefined
  };

  return result;
}