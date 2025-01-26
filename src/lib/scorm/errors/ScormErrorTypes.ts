export type ScormErrorCode = 
  | 'NO_ERROR'
  | 'GENERAL_EXCEPTION'
  | 'GENERAL_INIT_FAILURE'
  | 'ALREADY_INITIALIZED'
  | 'CONTENT_INSTANCE_TERMINATED'
  | 'GENERAL_GET_FAILURE'
  | 'GENERAL_SET_FAILURE'
  | 'GENERAL_COMMIT_FAILURE'
  | 'UNDEFINED_DATA_MODEL'
  | 'UNIMPLEMENTED_DATA_MODEL'
  | 'DATA_MODEL_ELEMENT_VALUE_NOT_INITIALIZED'
  | 'READ_ONLY_ELEMENT'
  | 'WRITE_ONLY_ELEMENT'
  | 'DATA_MODEL_ELEMENT_TYPE_MISMATCH'
  | 'DATA_MODEL_ELEMENT_VALUE_OUT_OF_RANGE'
  | 'DATA_MODEL_DEPENDENCY_NOT_ESTABLISHED';

export interface ScormErrorDetails {
  code: string;
  message: string;
  diagnostic?: string;
}

export const SCORM_ERROR_DETAILS: Record<ScormErrorCode, ScormErrorDetails> = {
  NO_ERROR: {
    code: '0',
    message: 'No error'
  },
  GENERAL_EXCEPTION: {
    code: '101',
    message: 'General exception',
    diagnostic: 'An unknown error occurred'
  },
  GENERAL_INIT_FAILURE: {
    code: '102',
    message: 'General initialization failure',
    diagnostic: 'Failed to initialize the SCORM API'
  },
  ALREADY_INITIALIZED: {
    code: '103',
    message: 'Already initialized',
    diagnostic: 'Attempt to initialize SCORM API when it was already initialized'
  },
  CONTENT_INSTANCE_TERMINATED: {
    code: '104',
    message: 'Content instance terminated',
    diagnostic: 'Attempt to call SCORM API after termination'
  },
  GENERAL_GET_FAILURE: {
    code: '301',
    message: 'General get failure',
    diagnostic: 'Failed to get value from data model'
  },
  GENERAL_SET_FAILURE: {
    code: '351',
    message: 'General set failure',
    diagnostic: 'Failed to set value in data model'
  },
  GENERAL_COMMIT_FAILURE: {
    code: '391',
    message: 'General commit failure',
    diagnostic: 'Failed to commit data to persistent storage'
  },
  UNDEFINED_DATA_MODEL: {
    code: '401',
    message: 'Undefined data model element',
    diagnostic: 'The data model element name is not recognized'
  },
  UNIMPLEMENTED_DATA_MODEL: {
    code: '402',
    message: 'Unimplemented data model element',
    diagnostic: 'The data model element is valid but not implemented'
  },
  DATA_MODEL_ELEMENT_VALUE_NOT_INITIALIZED: {
    code: '403',
    message: 'Data model element value not initialized',
    diagnostic: 'Attempt to read an uninitialized data model element'
  },
  READ_ONLY_ELEMENT: {
    code: '404',
    message: 'Data model element is read only',
    diagnostic: 'Attempt to write to a read-only data model element'
  },
  WRITE_ONLY_ELEMENT: {
    code: '405',
    message: 'Data model element is write only',
    diagnostic: 'Attempt to read a write-only data model element'
  },
  DATA_MODEL_ELEMENT_TYPE_MISMATCH: {
    code: '406',
    message: 'Data model element type mismatch',
    diagnostic: 'The value provided does not match the data type of the element'
  },
  DATA_MODEL_ELEMENT_VALUE_OUT_OF_RANGE: {
    code: '407',
    message: 'Data model element value out of range',
    diagnostic: 'The value provided is outside the valid range'
  },
  DATA_MODEL_DEPENDENCY_NOT_ESTABLISHED: {
    code: '408',
    message: 'Data model dependency not established',
    diagnostic: 'A prerequisite element value has not been set'
  }
};