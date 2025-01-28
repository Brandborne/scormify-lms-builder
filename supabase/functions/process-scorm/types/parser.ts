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
  dependencies?: string[];
}

export interface OrganizationItem {
  identifier: string;
  title: string;
  description?: string;
  objectives?: ObjectiveData;
  sequencing?: SequencingData;
  resourceId?: string;
  children?: OrganizationItem[];
}

export interface OrganizationsResult {
  default: string;
  items: OrganizationItem[];
}

export interface ManifestResult {
  title?: string;
  version?: string;
  scormVersion: string;
  status: string;
  startingPage?: string;
  prerequisites?: string[];
  metadata: MetadataResult;
  organizations: OrganizationsResult;
  resources: ResourceData[];
  sequencing?: SequencingData;
}