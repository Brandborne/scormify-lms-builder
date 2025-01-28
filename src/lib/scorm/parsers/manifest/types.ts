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

export interface OrganizationsResult {
  default: string;
  items: OrganizationItem[];
}

export interface MetadataResult {
  schema?: string;
  schemaVersion?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  version?: string;
  duration?: string;
  copyright?: string;
}

export interface ManifestData {
  scormVersion: string;
  status: string;
  metadata: MetadataResult;
  organizations: OrganizationsResult;
  resources: ResourceData[];
  sequencing: SequencingData;
  objectives: ObjectiveData;
}