import type { SequencingData } from '../../types/manifest.ts';
import { logDebug } from '../../utils/logger.ts';

export function parseSequencing(node: Element | null): SequencingData {
  logDebug('Parsing sequencing from node:', node);
  
  if (!node) {
    logDebug('No sequencing node found');
    return {};
  }

  const controlMode = node.querySelector('imsss\\:controlMode');
  const deliveryControls = node.querySelector('imsss\\:deliveryControls');
  const sequencingRules = Array.from(node.querySelectorAll('imsss\\:sequencingRules'));

  const result: SequencingData = {
    controlMode: controlMode ? {
      choice: controlMode.getAttribute('choice') === 'true',
      flow: controlMode.getAttribute('flow') === 'true',
      forwardOnly: controlMode.getAttribute('forwardOnly') === 'true'
    } : undefined,
    deliveryControls: deliveryControls ? {
      completionSetByContent: deliveryControls.getAttribute('completionSetByContent') === 'true',
      objectiveSetByContent: deliveryControls.getAttribute('objectiveSetByContent') === 'true'
    } : undefined,
    rules: sequencingRules.map(rule => ({
      conditions: Array.from(rule.querySelectorAll('imsss\\:ruleCondition')).map(condition => ({
        type: condition.getAttribute('type') || '',
        operator: condition.getAttribute('operator') || '',
        value: condition.getAttribute('value') || ''
      })),
      action: rule.getAttribute('action') || ''
    }))
  };

  logDebug('Parsed sequencing:', result);
  return result;
}