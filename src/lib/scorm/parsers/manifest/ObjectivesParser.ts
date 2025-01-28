import { ObjectiveData } from './types';

export function parseObjectives(objectivesNode: any): ObjectiveData {
  if (!objectivesNode) return { secondary: [] };

  const primaryObjective = objectivesNode['imsss:primaryObjective']?.[0];
  const secondaryObjectives = objectivesNode['imsss:objective'] || [];

  return {
    primary: primaryObjective ? {
      id: primaryObjective['$objectiveID'] || '',
      satisfiedByMeasure: primaryObjective['$satisfiedByMeasure'] === 'true',
      minNormalizedMeasure: parseFloat(primaryObjective['imsss:minNormalizedMeasure']?.[0]?.['#text'] || '0')
    } : undefined,
    secondary: (Array.isArray(secondaryObjectives) ? secondaryObjectives : [secondaryObjectives])
      .map((obj: any) => ({
        id: obj['$objectiveID'] || '',
        description: obj['imsss:description']?.[0]?.['#text']
      }))
  };
}