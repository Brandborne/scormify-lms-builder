export interface ObjectiveData {
  primary?: {
    id: string;
    satisfiedByMeasure: boolean;
    minNormalizedMeasure: number;
  };
  secondary: Array<{
    id: string;
    description?: string;
  }>;
}

export interface SequencingData {
  controlMode?: {
    choice: boolean;
    flow: boolean;
  };
  deliveryControls?: {
    completionSetByContent: boolean;
    objectiveSetByContent: boolean;
  };
}

export interface ResourceData {
  identifier: string;
  type: string;
  href?: string;
  scormType?: string;
  files: string[];
}

export interface OrganizationItem {
  identifier: string;
  title: string;
  objectives?: ObjectiveData;
  sequencing?: SequencingData;
  resourceId?: string;
}

export interface ScormManifest {
  title?: string;
  version?: string;
  scormVersion: string;
  status: string;
  metadata: {
    schema?: string;
    schemaVersion?: string;
    objectives?: ObjectiveData;
  };
  organizations: {
    default: string;
    items: OrganizationItem[];
  };
  resources: ResourceData[];
  sequencing?: SequencingData;
}