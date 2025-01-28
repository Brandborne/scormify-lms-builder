import { ControlMode, DeliveryControls, SequencingData } from './types';
import { logDebug } from '../../../utils/logger';

export function parseSequencing(sequencingNode: any): SequencingData {
  logDebug('Parsing sequencing from node:', sequencingNode);
  
  if (!sequencingNode) {
    logDebug('No sequencing node found');
    return {};
  }

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

  const rules = sequencingNode['imsss:sequencingRules']?.map((rule: any) => ({
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