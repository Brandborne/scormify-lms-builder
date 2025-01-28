import { getNodeText, getNodeAttribute, getAllNodes } from './xmlParser.ts';
import { OrganizationsResult, OrganizationItem } from '../types/manifest.ts';

export function parseOrganizations(organizationsNode: Element | null): OrganizationsResult {
  console.log('Parsing organizations from node:', organizationsNode?.outerHTML);
  
  if (!organizationsNode) {
    console.log('No organizations node found');
    return { default: '', items: [] };
  }

  const defaultOrg = getNodeAttribute(organizationsNode, 'default') || '';
  const organizationNodes = getAllNodes(organizationsNode, 'organization');

  const items = organizationNodes.map(parseOrganizationItem).filter(Boolean);

  const result = {
    default: defaultOrg,
    items
  };

  console.log('Parsed organizations:', result);
  return result;
}

function parseOrganizationItem(item: Element): OrganizationItem | null {
  console.log('Parsing organization item:', item.outerHTML);
  
  if (!item) return null;

  const identifier = getNodeAttribute(item, 'identifier') || '';
  const title = getNodeText(item, 'title');
  const resourceId = getNodeAttribute(item, 'identifierref');

  // Handle prerequisites
  const prerequisites = getAllNodes(item, 'adlcp\\:prerequisites, prerequisites')
    .map(prereq => prereq.textContent?.trim())
    .filter(Boolean);

  // Handle child items
  const children = getAllNodes(item, 'item')
    .map(childItem => parseOrganizationItem(childItem))
    .filter(Boolean);

  const result = {
    identifier,
    title: title || '',
    prerequisites: prerequisites.length ? prerequisites : undefined,
    resourceId,
    children: children.length ? children : undefined
  };

  console.log('Parsed organization item:', result);
  return result;
}