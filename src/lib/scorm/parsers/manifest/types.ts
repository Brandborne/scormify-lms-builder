export interface ControlMode {
  choice: boolean;
  flow: boolean;
  forwardOnly?: boolean;
}

export interface DeliveryControls {
  completionSetByContent: boolean;
  objectiveSetByContent: boolean;
}

export interface SequencingRule {
  conditions: Array<{
    type: string;
    operator: string;
    value: string;
  }>;
  action: string;
}

export interface SequencingData {
  controlMode?: ControlMode;
  deliveryControls?: DeliveryControls;
  rules?: SequencingRule[];
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

export interface ResourceFile {
  href: string;
  type?: string;
}

export interface Resource {
  identifier: string;
  type: string;
  href?: string;
  scormType?: string;
  files: ResourceFile[];
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

export interface ManifestData {
  title?: string;
  version?: string;
  scormVersion: string;
  status: string;
  startingPage?: string;
  metadata: MetadataResult;
  organizations: OrganizationsResult;
  resources: Resource[];
  sequencing?: SequencingData;
}