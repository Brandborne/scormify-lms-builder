import { CompletionStatus } from './types';
import { validateDataModelValue } from './validation';
import { SCORM_ERROR_CODES } from './constants';

export const traverseDataModel = (data: any, path: string): any => {
  const parts = path.split('.');
  let current: any = data;
  
  for (const part of parts) {
    if (current === undefined) return undefined;
    current = current[part];
  }
  
  return current;
};

export const updateDataModel = (data: any, path: string, value: any): { success: boolean; error?: string } => {
  // Validate the value before updating
  const validation = validateDataModelValue(path, value);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const parts = path.split('.');
  const last = parts.pop()!;
  let current: any = data;
  
  for (const part of parts) {
    if (!(part in current)) {
      current[part] = {};
    }
    current = current[part];
  }

  current[last] = value;
  return { success: true };
};

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return `PT${hours}H${minutes}M${remainingSeconds}S`;
};