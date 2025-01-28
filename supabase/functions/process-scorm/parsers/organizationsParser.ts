interface Organization {
  identifier: string;
  title: string;
  objectives?: {
    primary?: {
      id: string;
      minScore: number;
      satisfiedByMeasure: boolean;
    };
    secondary: Array<{
      id: string;
    }>;
  };
}

export function parseOrganizations(organizationsNode: any) {
  if (!organizationsNode?.organization) {
    return { default: '', items: [] };
  }

  const org = organizationsNode.organization;
  const defaultOrg = organizationsNode['@_default'] || '';

  const objectives = org.item?.['imsss:sequencing']?.['imsss:objectives'];
  const primaryObjective = objectives?.['imsss:primaryObjective'];
  const secondaryObjectives = objectives?.['imsss:objective'] || [];

  const organization: Organization = {
    identifier: org['@_identifier'] || '',
    title: org.title || '',
  };

  if (primaryObjective || secondaryObjectives.length > 0) {
    organization.objectives = {
      primary: primaryObjective ? {
        id: primaryObjective['@_objectiveID'] || '',
        minScore: parseFloat(primaryObjective['imsss:minNormalizedMeasure'] || '0'),
        satisfiedByMeasure: primaryObjective['@_satisfiedByMeasure'] === 'true'
      } : undefined,
      secondary: Array.isArray(secondaryObjectives) 
        ? secondaryObjectives.map(obj => ({ id: obj['@_objectiveID'] || '' }))
        : [{ id: secondaryObjectives['@_objectiveID'] || '' }]
    };
  }

  return {
    default: defaultOrg,
    items: [organization]
  };
}