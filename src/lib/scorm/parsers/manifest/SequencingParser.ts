import { SequencingData, ControlMode, DeliveryControls, SequencingRules } from './types';

export function parseSequencing(sequencingNode: any): SequencingData {
  if (!sequencingNode) return {};

  const controlMode = sequencingNode['imsss:controlMode']?.[0];
  const deliveryControls = sequencingNode['imsss:deliveryControls']?.[0];

  const parsedControlMode: ControlMode | undefined = controlMode ? {
    choice: controlMode['$choice'] === 'true',
    flow: controlMode['$flow'] === 'true',
    forwardOnly: controlMode['$forwardOnly'] === 'true'
  } : undefined;

  const parsedDeliveryControls: DeliveryControls | undefined = deliveryControls ? {
    completionSetByContent: deliveryControls['$completionSetByContent'] === 'true',
    objectiveSetByContent: deliveryControls['$objectiveSetByContent'] === 'true'
  } : undefined;

  const rules: SequencingRules[] = sequencingNode['imsss:sequencingRules']?.map((rule: any) => ({
    conditions: rule.conditions?.map((condition: any) => ({
      type: condition['$type'] || '',
      operator: condition['$operator'] || '',
      value: condition['$value'] || ''
    })) || [],
    action: rule['$action'] || ''
  })) || [];

  return {
    controlMode: parsedControlMode,
    deliveryControls: parsedDeliveryControls,
    rules
  };
}