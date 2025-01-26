export type CompletionStatus = 'completed' | 'incomplete' | 'not attempted' | 'unknown';
export type SuccessStatus = 'passed' | 'failed' | 'unknown';
export type Mode = 'normal' | 'browse' | 'review';
export type Entry = 'ab-initio' | 'resume' | '';
export type Exit = 'timeout' | 'suspend' | 'logout' | 'normal' | '';
export type Credit = 'credit' | 'no-credit';
export type InteractionType = 'true-false' | 'choice' | 'fill-in' | 'matching' | 'performance' | 'sequencing' | 'likert' | 'numeric';
export type Result = 'correct' | 'incorrect' | 'unanticipated' | 'neutral' | number;

export interface ScoreData {
  scaled?: number;
  raw?: number;
  min?: number;
  max?: number;
}

export interface InteractionData {
  id: string;
  type: InteractionType;
  objectives?: string[];
  timestamp?: string;
  weighting?: number;
  learner_response?: string;
  result?: Result;
  latency?: string;
  description?: string;
}

export interface ObjectiveData {
  id: string;
  score?: ScoreData;
  success_status?: SuccessStatus;
  completion_status?: CompletionStatus;
  description?: string;
  progress_measure?: number;
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
  objectives?: { [key: string]: ObjectiveData };
  interactions?: { [key: string]: InteractionData };
  learner_name?: string;
  learner_id?: string;
  [key: string]: any;
}

export interface ScormData {
  cmi?: CMIData;
}

export interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'enum' | 'object';
  required?: boolean;
  min?: number;
  max?: number;
  allowedValues?: string[];
  pattern?: RegExp;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}