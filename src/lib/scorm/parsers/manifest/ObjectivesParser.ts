interface Objective {
  id: string;
  satisfiedByMeasure?: boolean;
  minNormalizedMeasure?: number;
  description?: string;
}

interface ObjectivesData {
  primary?: Objective;
  secondary: Objective[];
}

export function parseObjectives(objectivesNode: any): ObjectivesData {
  if (!objectivesNode) return { secondary: [] };

  const primaryObjective = objectivesNode['imsss:primaryObjective']?.[0];
  const secondaryObjectives = objectivesNode['imsss:objective'] || [];

  return {
    primary: primaryObjective ? {
      id: primaryObjective['$objectiveID'] || '',
      satisfiedByMeasure: primaryObjective['$satisfiedByMeasure'] === 'true',
      minNormalizedMeasure: parseFloat(primaryObjective['imsss:minNormalizedMeasure']?.[0]?.['#text'] || '0'),
      description: primaryObjective['imsss:description']?.[0]?.['#text']
    } : undefined,
    secondary: (Array.isArray(secondaryObjectives) ? secondaryObjectives : [secondaryObjectives])
      .map((obj: any) => ({
        id: obj['$objectiveID'] || '',
        description: obj['imsss:description']?.[0]?.['#text']
      }))
  };
}