export const SCORM_ERROR_MESSAGES = {
  // Initialization Errors
  ALREADY_INITIALIZED: {
    code: '103',
    message: 'Content instance already initialized',
    diagnostic: 'Initialize was called more than once'
  },
  NOT_INITIALIZED: {
    code: '301',
    message: 'Content instance not initialized',
    diagnostic: 'API function called before initialization'
  },
  TERMINATED: {
    code: '104',
    message: 'Content instance terminated',
    diagnostic: 'API function called after termination'
  },

  // Data Model Errors
  INVALID_SET_VALUE: {
    code: '351',
    message: 'Invalid set value, element is read only',
    diagnostic: 'Attempted to set a read-only data model element'
  },
  INVALID_GET_VALUE: {
    code: '301',
    message: 'Invalid get value',
    diagnostic: 'Attempted to get an invalid or uninitialized data model element'
  },
  TYPE_MISMATCH: {
    code: '406',
    message: 'Data model element type mismatch',
    diagnostic: 'Value type does not match the data model element definition'
  },
  VALUE_OUT_OF_RANGE: {
    code: '407',
    message: 'Data model element value out of range',
    diagnostic: 'Value is outside the acceptable range for this element'
  },

  // General Errors
  GENERAL_EXCEPTION: {
    code: '101',
    message: 'General exception',
    diagnostic: 'An unknown error occurred'
  },
  GENERAL_INITIALIZATION_FAILURE: {
    code: '102',
    message: 'General initialization failure',
    diagnostic: 'Content failed to initialize'
  }
} as const;