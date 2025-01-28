import { getNodeText, getNodeAttribute, getAllNodes } from './xmlParser.ts';
import type { OrganizationItem } from '../../types/parser.ts';

export function parseOrganizations(organizationsNode: Element | null): { default: string; items: OrganizationItem[] } {
  console.log('Parsing organizations from node:', organizationsNode?.outerHTML);
  
  if (!organizationsNode) {
    console.log('No organizations node found');
    return { default: '', items: [] };
  }

  const defaultOrg = getNodeAttribute(organizationsNode, 'default') || '';
  const organizationNodes = getAllNodes(organizationsNode, 'organization');

  const items = organizationNodes.map(parseOrganizationItem).filter(Boolean) as OrganizationItem[];

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
  const title = getNodeText(item, 'title') || '';
  const resourceId = getNodeAttribute(item, 'identifierref');

  const result: OrganizationItem = {
    identifier,
    title,
    resourceId
  };

  console.log('Parsed organization item:', result);
  return result;
}