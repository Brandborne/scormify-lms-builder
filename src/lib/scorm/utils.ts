import { CompletionStatus } from './types';

export const validateCompletionStatus = (status: string): CompletionStatus => {
  const validStatuses: CompletionStatus[] = ['completed', 'incomplete', 'not attempted', 'unknown'];
  return validStatuses.includes(status as CompletionStatus) 
    ? status as CompletionStatus 
    : 'unknown';
};

export const traverseDataModel = (data: any, path: string): any => {
  const parts = path.split('.');
  let current: any = data;
  
  for (const part of parts) {
    if (current === undefined) return undefined;
    current = current[part];
  }
  
  return current;
};

export const updateDataModel = (data: any, path: string, value: string): void => {
  const parts = path.split('.');
  const last = parts.pop()!;
  let current: any = data;
  
  for (const part of parts) {
    if (!(part in current)) {
      current[part] = {};
    }
    current = current[part];
  }

  if (path === 'cmi.completion_status') {
    current[last] = validateCompletionStatus(value);
  } else {
    current[last] = value;
  }
};