import { getNodeText, getNodeAttribute, getAllNodes } from '../utils/xmlUtils.ts';

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
  const secondaryObjectives = getAllNodes(objectivesElement, 'imsss\\:objective, objective');

  return {
    primary: primaryObjective ? {
      id: primaryObjective.getAttribute('objectiveID') || '',
      satisfiedByMeasure: primaryObjective.getAttribute('satisfiedByMeasure') === 'true',
      minNormalizedMeasure: parseFloat(getNodeText(primaryObjective, 'imsss\\:minNormalizedMeasure, minNormalizedMeasure') || '0')
    } : undefined,
    secondary: secondaryObjectives.map(obj => ({
      id: obj.getAttribute('objectiveID') || '',
      description: getNodeText(obj, 'imsss\\:description, description')
    }))
  };
}

function parseOrganizationItem(itemElement: Element): OrganizationItem {
  const children = getAllNodes(itemElement, ':scope > item')
    .map(child => parseOrganizationItem(child));

  const prerequisites = getAllNodes(itemElement, 'adlcp\\:prerequisites, prerequisites')
    .map(prereq => prereq.textContent || '')
    .filter(Boolean);

  return {
    identifier: getNodeAttribute(itemElement, 'identifier') || '',
    title: getNodeText(itemElement, 'title') || '',
    description: getNodeText(itemElement, 'description'),
    objectives: parseObjectives(itemElement.querySelector('imsss\\:objectives, objectives')),
    sequencing: parseSequencing(itemElement.querySelector('imsss\\:sequencing, sequencing')),
    prerequisites: prerequisites.length > 0 ? prerequisites : undefined,
    resourceId: getNodeAttribute(itemElement, 'identifierref'),
    children: children.length > 0 ? children : undefined
  };
}

export function parseOrganizations(organizationsElement: Element | null): OrganizationsResult {
  if (!organizationsElement) {
    return { default: '', items: [] };
  }

  const defaultOrg = organizationsElement.getAttribute('default') || '';
  const organizations = getAllNodes(organizationsElement, ':scope > organization');

  return {
    default: defaultOrg,
    items: organizations.map(org => parseOrganizationItem(org))
  };
}