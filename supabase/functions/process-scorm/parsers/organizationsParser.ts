interface OrganizationItem {
  identifier: string;
  title: string;
  description?: string;
  objectives?: {
    primary?: {
      id: string;
      satisfiedByMeasure: boolean;
      minNormalizedMeasure: number;
    };
    secondary: Array<{
      id: string;
      description?: string;
    }>;
  };
  sequencing?: {
    controlMode?: {
      choice: boolean;
      flow: boolean;
      forwardOnly?: boolean;
    };
    deliveryControls?: {
      completionSetByContent: boolean;
      objectiveSetByContent: boolean;
    };
  };
  prerequisites?: string[];
  resourceId?: string;
  children?: OrganizationItem[];
}

interface OrganizationsResult {
  default: string;
  items: OrganizationItem[];
}

function parseSequencing(sequencingElement: Element | null): OrganizationItem['sequencing'] {
  if (!sequencingElement) return undefined;

  const controlMode = sequencingElement.querySelector('imsss\\:controlMode, controlMode');
  const deliveryControls = sequencingElement.querySelector('imsss\\:deliveryControls, deliveryControls');

  return {
    controlMode: controlMode ? {
      choice: controlMode.getAttribute('choice') === 'true',
      flow: controlMode.getAttribute('flow') === 'true',
      forwardOnly: controlMode.getAttribute('forwardOnly') === 'true'
    } : undefined,
    deliveryControls: deliveryControls ? {
      completionSetByContent: deliveryControls.getAttribute('completionSetByContent') === 'true',
      objectiveSetByContent: deliveryControls.getAttribute('objectiveSetByContent') === 'true'
    } : undefined
  };
}

function parseObjectives(objectivesElement: Element | null): OrganizationItem['objectives'] {
  if (!objectivesElement) return undefined;

  const primaryObjective = objectivesElement.querySelector('imsss\\:primaryObjective, primaryObjective');
  const secondaryObjectives = Array.from(objectivesElement.querySelectorAll('imsss\\:objective, objective'));

  return {
    primary: primaryObjective ? {
      id: primaryObjective.getAttribute('objectiveID') || '',
      satisfiedByMeasure: primaryObjective.getAttribute('satisfiedByMeasure') === 'true',
      minNormalizedMeasure: parseFloat(primaryObjective.querySelector('imsss\\:minNormalizedMeasure, minNormalizedMeasure')?.textContent || '0')
    } : undefined,
    secondary: secondaryObjectives.map(obj => ({
      id: obj.getAttribute('objectiveID') || '',
      description: obj.querySelector('imsss\\:description, description')?.textContent
    }))
  };
}

function parseOrganizationItem(itemElement: Element): OrganizationItem {
  const children = Array.from(itemElement.querySelectorAll(':scope > item'))
    .map(child => parseOrganizationItem(child));

  const prerequisites = Array.from(itemElement.querySelectorAll('adlcp\\:prerequisites, prerequisites'))
    .map(prereq => prereq.textContent || '')
    .filter(Boolean);

  return {
    identifier: itemElement.getAttribute('identifier') || '',
    title: itemElement.querySelector('title')?.textContent || '',
    description: itemElement.querySelector('description')?.textContent,
    objectives: parseObjectives(itemElement.querySelector('imsss\\:objectives, objectives')),
    sequencing: parseSequencing(itemElement.querySelector('imsss\\:sequencing, sequencing')),
    prerequisites: prerequisites.length > 0 ? prerequisites : undefined,
    resourceId: itemElement.getAttribute('identifierref'),
    children: children.length > 0 ? children : undefined
  };
}

export function parseOrganizations(organizationsElement: Element | null): OrganizationsResult {
  if (!organizationsElement) {
    return { default: '', items: [] };
  }

  const defaultOrg = organizationsElement.getAttribute('default') || '';
  const organizations = Array.from(organizationsElement.querySelectorAll(':scope > organization'));

  return {
    default: defaultOrg,
    items: organizations.map(org => parseOrganizationItem(org))
  };
}