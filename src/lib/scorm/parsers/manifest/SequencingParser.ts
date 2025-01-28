import { SequencingData } from './types';

export function parseSequencing(node: any): SequencingData {
  if (!node) return {};

  const controlMode = node['imsss:controlMode']?.[0];
  const deliveryControls = node['imsss:deliveryControls']?.[0];
  const sequencingRules = node['imsss:sequencingRules']?.[0];

  return {
    controlMode: controlMode ? {
      choice: controlMode['$choice'] === 'true',
      flow: controlMode['$flow'] === 'true',
      forwardOnly: controlMode['$forwardOnly'] === 'true'
    } : undefined,
    deliveryControls: deliveryControls ? {
      completionSetByContent: deliveryControls['$completionSetByContent'] === 'true',
      objectiveSetByContent: deliveryControls['$objectiveSetByContent'] === 'true'
    } : undefined,
    rules: sequencingRules ? parseRules(sequencingRules) : undefined
  };
}

function parseRules(rulesNode: any): Array<{
  conditions: Array<{
    type: string;
    operator: string;
    value: string;
  }>;
  action: string;
}> {
  if (!rulesNode) return [];

  const rules = Array.isArray(rulesNode) ? rulesNode : [rulesNode];
  return rules.map(rule => ({
    conditions: parseConditions(rule['imsss:ruleCondition']),
    action: rule['$action'] || ''
  }));
}

function parseConditions(conditions: any): Array<{
  type: string;
  operator: string;
  value: string;
}> {
  if (!conditions) return [];

  const conditionArray = Array.isArray(conditions) ? conditions : [conditions];
  return conditionArray.map(condition => ({
    type: condition['$type'] || '',
    operator: condition['$operator'] || '',
    value: condition['$value'] || ''
  }));
}