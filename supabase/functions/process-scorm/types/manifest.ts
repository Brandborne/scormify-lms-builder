export interface ManifestData {
  identifier: string;
  version: string;
  scormVersion: string;
  title: string;
  status: 'processed';
  startingPage: string;
  organizations: {
    default: string;
    items: Array<{
      identifier: string;
      title: string;
      objectives?: {
        primary?: {
          id: string;
          minScore: number;
          satisfiedByMeasure: boolean;
        };
        secondary: Array<{
          id: string;
        }>;
      };
    }>;
  };
  resources: Array<{
    identifier: string;
    type: string;
    scormType?: string;
    href?: string;
    files: Array<{
      href: string;
    }>;
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}