export type CompletionStatus = 'completed' | 'incomplete' | 'not attempted' | 'unknown';
export type SuccessStatus = 'passed' | 'failed' | 'unknown';
export type Mode = 'normal' | 'browse' | 'review';
export type Entry = 'ab-initio' | 'resume' | '';
export type Exit = 'timeout' | 'suspend' | 'logout' | 'normal' | '';
export type Credit = 'credit' | 'no-credit';

export interface ScoreData {
  scaled?: number;
  raw?: number;
  min?: number;
  max?: number;
}

export interface CMIData {
  completion_status?: CompletionStatus;
  success_status?: SuccessStatus;
  score?: ScoreData;
  progress_measure?: number;
  location?: string;
  suspend_data?: string;
  total_time?: string;
  session_time?: string;
  mode?: Mode;
  entry?: Entry;
  exit?: Exit;
  credit?: Credit;
  [key: string]: any;
}

export interface ScormData {
  cmi?: CMIData;
}