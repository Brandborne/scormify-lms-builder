export const SCORM_VERSIONS = {
  SCORM_12: 'SCORM 1.2',
  SCORM_2004: 'SCORM 2004'
} as const;

export type ScormVersion = typeof SCORM_VERSIONS[keyof typeof SCORM_VERSIONS];

export const SCORM_NAMESPACES = {
  SCORM_12: 'http://www.adlnet.org/xsd/adlcp_rootv1p2',
  SCORM_2004: 'http://www.adlnet.org/xsd/adlcp_v1p3'
};