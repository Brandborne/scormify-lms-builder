import { OrganizationItem, OrganizationsResult, ObjectiveData } from './types';

export function parseOrganizations(organizationsNode: any): OrganizationsResult {
  if (!organizationsNode) {
    return { default: '', items: [] };
  }

  const defaultOrg = organizationsNode['$default'];
  const organizations = organizationsNode['organization'] || [];

  const items = Array.isArray(organizations) 
    ? organizations.map(parseOrganizationItem)
    : [parseOrganizationItem(organizations)];

  return {
    default: defaultOrg || '',
    items
  };
}

function parseOrganizationItem(item: any): OrganizationItem {
  if (!item) return { identifier: '', title: '' };

  const identifier = item['$identifier'] || '';
  const title = item['title']?.[0]?.['#text'] || '';
  const description = item['description']?.[0]?.['#text'];
  const resourceId = item['$identifierref'];

  // Convert objectives to proper ObjectiveData format
  const objectives: ObjectiveData = {
    secondary: item['adlcp:objectives']?.map((obj: any) => ({
      id: obj['#text'] || '',
      description: obj['description']?.[0]?.['#text']
    })) || []
  };

  const children = item['item']?.map(parseOrganizationItem) || [];

  return {
    identifier,
    title,
    description,
    objectives,
    resourceId,
    children
  };
}