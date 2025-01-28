import type { SequencingData } from '../types/parser.ts';

export function parseSequencing(node: any): SequencingData {
  console.log('Parsing sequencing from node:', node);
  
  if (!node) {
    console.log('No sequencing node found');
    return {};
  }

  const controlMode = node['imsss:controlMode']?.[0];
  const deliveryControls = node['imsss:deliveryControls']?.[0];

  const result: SequencingData = {
    controlMode: controlMode ? {
      choice: controlMode['$choice'] === 'true',
      flow: controlMode['$flow'] === 'true'
    } : undefined,
    deliveryControls: deliveryControls ? {
      completionSetByContent: deliveryControls['$completionSetByContent'] === 'true',
      objectiveSetByContent: deliveryControls['$objectiveSetByContent'] === 'true'
    } : undefined
  };

  console.log('Parsed sequencing:', result);
  return result;
}