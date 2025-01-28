import { ObjectiveData } from '../types/manifest';

export function parseObjectives(node: any): ObjectiveData {
  const primaryObjective = node?.['imsss:primaryObjective']?.[0];
  const secondaryObjectives = node?.['imsss:objective'] || [];

  return {
    primary: primaryObjective ? {
      id: primaryObjective['$objectiveID'] || '',
      satisfiedByMeasure: primaryObjective['$satisfiedByMeasure'] === 'true',
      minNormalizedMeasure: parseFloat(primaryObjective['imsss:minNormalizedMeasure']?.[0]?.['#text'] || '0')
    } : undefined,
    secondary: Array.isArray(secondaryObjectives) 
      ? secondaryObjectives.map(obj => ({
          id: obj['$objectiveID'] || '',
          description: obj['#text'] || undefined
        }))
      : [{ 
          id: secondaryObjectives['$objectiveID'] || '',
          description: secondaryObjectives['#text'] || undefined
        }]
  };
}