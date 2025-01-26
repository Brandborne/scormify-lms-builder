import { ValidationRule, ValidationRules, CompletionStatus, SuccessStatus, Mode, Entry, Exit, Credit, InteractionType } from './types';
import { SCORM_ERROR_CODES } from './constants';

const timePattern = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d{1,2})S))?)?$/;

export const CMI_VALIDATION_RULES: ValidationRules = {
  'cmi.completion_status': {
    type: 'enum',
    allowedValues: ['completed', 'incomplete', 'not attempted', 'unknown'],
    required: true
  },
  'cmi.success_status': {
    type: 'enum',
    allowedValues: ['passed', 'failed', 'unknown'],
    required: true
  },
  'cmi.score.scaled': {
    type: 'number',
    min: -1,
    max: 1
  },
  'cmi.score.raw': {
    type: 'number'
  },
  'cmi.score.min': {
    type: 'number'
  },
  'cmi.score.max': {
    type: 'number'
  },
  'cmi.progress_measure': {
    type: 'number',
    min: 0,
    max: 1
  },
  'cmi.total_time': {
    type: 'string',
    pattern: timePattern
  }
};

export function validateDataModelValue(element: string, value: any): { isValid: boolean; error?: string } {
  const rule = CMI_VALIDATION_RULES[element];
  if (!rule) {
    return { isValid: true }; // If no validation rule exists, consider it valid
  }

  if (rule.required && (value === undefined || value === null)) {
    return {
      isValid: false,
      error: SCORM_ERROR_CODES.DATA_MODEL_ELEMENT_VALUE_NOT_INITIALIZED
    };
  }

  switch (rule.type) {
    case 'number':
      if (typeof value !== 'number') {
        return {
          isValid: false,
          error: SCORM_ERROR_CODES.DATA_MODEL_ELEMENT_TYPE_MISMATCH
        };
      }
      if (rule.min !== undefined && value < rule.min) {
        return {
          isValid: false,
          error: SCORM_ERROR_CODES.DATA_MODEL_ELEMENT_VALUE_OUT_OF_RANGE
        };
      }
      if (rule.max !== undefined && value > rule.max) {
        return {
          isValid: false,
          error: SCORM_ERROR_CODES.DATA_MODEL_ELEMENT_VALUE_OUT_OF_RANGE
        };
      }
      break;

    case 'enum':
      if (!rule.allowedValues?.includes(value)) {
        return {
          isValid: false,
          error: SCORM_ERROR_CODES.DATA_MODEL_ELEMENT_VALUE_OUT_OF_RANGE
        };
      }
      break;

    case 'string':
      if (typeof value !== 'string') {
        return {
          isValid: false,
          error: SCORM_ERROR_CODES.DATA_MODEL_ELEMENT_TYPE_MISMATCH
        };
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return {
          isValid: false,
          error: SCORM_ERROR_CODES.DATA_MODEL_ELEMENT_VALUE_OUT_OF_RANGE
        };
      }
      break;
  }

  return { isValid: true };
}

export function validateCompletionStatus(status: string): CompletionStatus {
  const validStatuses: CompletionStatus[] = ['completed', 'incomplete', 'not attempted', 'unknown'];
  return validStatuses.includes(status as CompletionStatus) 
    ? status as CompletionStatus 
    : 'unknown';
}

export function validateSuccessStatus(status: string): SuccessStatus {
  const validStatuses: SuccessStatus[] = ['passed', 'failed', 'unknown'];
  return validStatuses.includes(status as SuccessStatus)
    ? status as SuccessStatus
    : 'unknown';
}