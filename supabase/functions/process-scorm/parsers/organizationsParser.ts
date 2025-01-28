import type { OrganizationsResult, OrganizationItem } from '../types/parser.ts';

export function parseOrganizations(organizationsNode: any): OrganizationsResult {
  console.log('Parsing organizations from node:', JSON.stringify(organizationsNode, null, 2));
  
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

  console.log('Parsed organizations:', JSON.stringify(result, null, 2));
  return result;
}

function parseOrganizationItem(item: any): OrganizationItem | null {
  console.log('Parsing organization item:', JSON.stringify(item, null, 2));
  
  if (!item) return null;

  const identifier = item['$identifier'] || '';
  const title = item.title?.[0]?.['#text'] || '';
  const description = item.description?.[0]?.['#text'];
  const resourceId = item['$identifierref'];

  const prerequisites = item['adlcp:prerequisites']?.map((prereq: any) => 
    prereq['#text']
  ).filter(Boolean);

  const children = item.item?.map((childItem: any) => 
    parseOrganizationItem(childItem)
  ).filter(Boolean);

  const result: OrganizationItem = {
    identifier,
    title,
    description,
    prerequisites: prerequisites?.length ? prerequisites : undefined,
    resourceId,
    children: children?.length ? children : undefined
  };

  // Remove undefined properties
  Object.keys(result).forEach(key => 
    result[key] === undefined && delete result[key]
  );

  console.log('Parsed organization item:', JSON.stringify(result, null, 2));
  return result;
}