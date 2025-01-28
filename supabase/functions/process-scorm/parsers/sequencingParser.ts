import { SequencingData } from '../types/manifest';

export function parseSequencing(node: any): SequencingData {
  if (!node) return {};

  const controlMode = node['imsss:controlMode']?.[0];
  const deliveryControls = node['imsss:deliveryControls']?.[0];

  return {
    controlMode: controlMode ? {
      choice: controlMode['$choice'] === 'true',
      flow: controlMode['$flow'] === 'true'
    } : undefined,
    deliveryControls: deliveryControls ? {
      completionSetByContent: deliveryControls['$completionSetByContent'] === 'true',
      objectiveSetByContent: deliveryControls['$objectiveSetByContent'] === 'true'
    } : undefined
  };
}