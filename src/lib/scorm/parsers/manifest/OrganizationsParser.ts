interface OrganizationItem {
  identifier: string;
  title: string;
  description?: string;
  objectives?: string[];
  prerequisites?: string[];
  resourceId?: string;
  children?: OrganizationItem[];
}

interface OrganizationsResult {
  default: string;
  items: OrganizationItem[];
}

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

  const objectives = item['adlcp:objectives']?.map((obj: any) => obj['#text']) || [];
  const prerequisites = item['adlcp:prerequisites']?.map((pre: any) => pre['#text']) || [];

  const children = item['item']?.map(parseOrganizationItem) || [];

  return {
    identifier,
    title,
    description,
    objectives,
    prerequisites,
    resourceId,
    children
  };
}