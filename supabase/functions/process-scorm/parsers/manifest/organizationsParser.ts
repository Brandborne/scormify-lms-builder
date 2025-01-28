import { getNodeText, getNodeAttribute, getAllNodes } from '../xml/xmlParser.ts';
import type { OrganizationItem, OrganizationsResult } from './types.ts';
import { logDebug } from '../../utils/logger.ts';

export function parseOrganizations(organizationsNode: any): OrganizationsResult {
  logDebug('Parsing organizations from node:', organizationsNode);
  
  if (!organizationsNode) {
    logDebug('No organizations node found');
    return { default: '', items: [] };
  }

  const defaultOrg = getNodeAttribute(organizationsNode, 'default') || '';
  const organizationNodes = getAllNodes(organizationsNode, 'organization');

  const items = organizationNodes.map(parseOrganizationItem).filter(Boolean) as OrganizationItem[];

  const result = {
    default: defaultOrg,
    items
  };

  logDebug('Parsed organizations:', result);
  return result;
}

function parseOrganizationItem(item: any): OrganizationItem | null {
  logDebug('Parsing organization item:', item);
  
  if (!item) return null;

  const identifier = getNodeAttribute(item, 'identifier') || '';
  const title = getNodeText(item, 'title') || '';
  const resourceId = getNodeAttribute(item, 'identifierref');

  const result: OrganizationItem = {
    identifier,
    title,
    resourceId
  };

  logDebug('Parsed organization item:', result);
  return result;
}