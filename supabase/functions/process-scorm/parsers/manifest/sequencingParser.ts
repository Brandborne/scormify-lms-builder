import { getNodeText, getNodeAttribute, getAllNodes } from '../xml/xmlParser.ts';
import type { SequencingData } from './types.ts';
import { logDebug } from '../../utils/logger.ts';

export function parseSequencing(node: any): SequencingData {
  logDebug('Parsing sequencing from node:', node);
  
  if (!node) {
    logDebug('No sequencing node found');
    return {};
  }

  const controlMode = getAllNodes(node, 'imsss:controlMode')[0];
  const deliveryControls = getAllNodes(node, 'imsss:deliveryControls')[0];
  const sequencingRules = getAllNodes(node, 'imsss:sequencingRules');

  const result: SequencingData = {
    controlMode: controlMode ? {
      choice: getNodeAttribute(controlMode, 'choice') === 'true',
      flow: getNodeAttribute(controlMode, 'flow') === 'true',
      forwardOnly: getNodeAttribute(controlMode, 'forwardOnly') === 'true'
    } : undefined,
    deliveryControls: deliveryControls ? {
      completionSetByContent: getNodeAttribute(deliveryControls, 'completionSetByContent') === 'true',
      objectiveSetByContent: getNodeAttribute(deliveryControls, 'objectiveSetByContent') === 'true'
    } : undefined,
    rules: sequencingRules.map(rule => ({
      conditions: getAllNodes(rule, 'imsss:ruleCondition').map(condition => ({
        type: getNodeAttribute(condition, 'type') || '',
        operator: getNodeAttribute(condition, 'operator') || '',
        value: getNodeAttribute(condition, 'value') || ''
      })),
      action: getNodeAttribute(rule, 'action') || ''
    }))
  };

  logDebug('Parsed sequencing:', result);
  return result;
}