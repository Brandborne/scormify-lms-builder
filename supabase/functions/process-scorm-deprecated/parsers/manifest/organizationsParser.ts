import type { OrganizationsResult, OrganizationItem, ObjectiveData } from '../../types/manifest.ts';
import { logDebug } from '../../utils/logger.ts';
import { getNodeText } from '../xml/xmlParser.ts';

export function parseOrganizations(organizationsNode: Element | null): OrganizationsResult {
  if (!organizationsNode) {
    return { default: '', items: [] };
  }

  const defaultOrg = organizationsNode.getAttribute('default') || '';
  const organizations = Array.from(organizationsNode.querySelectorAll('organization'));

  const items = organizations.map(parseOrganizationItem);

  return {
    default: defaultOrg,
    items
  };
}

function parseOrganizationItem(item: Element): OrganizationItem {
  if (!item) return { identifier: '', title: '' };

  const identifier = item.getAttribute('identifier') || '';
  const title = getNodeText(item, 'title') || '';
  const description = getNodeText(item, 'description');
  const resourceId = item.getAttribute('identifierref');

  // Convert objectives to proper ObjectiveData format
  const objectives: ObjectiveData = {
    secondary: Array.from(item.querySelectorAll('adlcp\\:objectives'))
      .map(obj => ({
        id: obj.textContent || '',
        description: getNodeText(obj, 'description')
      }))
  };

  const children = Array.from(item.querySelectorAll('item'))
    .map(childItem => parseOrganizationItem(childItem));

  return {
    identifier,
    title,
    description,
    objectives,
    resourceId,
    children
  };
}