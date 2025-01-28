import { detectScormVersion } from './parsers/versionParser.ts';
import { parseMetadata } from './parsers/metadataParser.ts';
import { parseOrganizations } from './parsers/organizationsParser.ts';
import { parseResources } from './parsers/resourcesParser.ts';

export interface ManifestResult {
  title?: string;
  version?: string;
  scormVersion: string;
  status: string;
  startingPage?: string;
  prerequisites?: string[];
  metadata: {
    schema?: string;
    schemaVersion?: string;
    description?: string;
    keywords?: string[];
    duration?: string;
    copyright?: string;
  };
  organizations: {
    default: string;
    items: Array<{
      identifier: string;
      title: string;
      description?: string;
      objectives?: {
        primary?: {
          id: string;
          satisfiedByMeasure: boolean;
          minNormalizedMeasure: number;
        };
        secondary: Array<{
          id: string;
          description?: string;
        }>;
      };
      sequencing?: {
        controlMode?: {
          choice: boolean;
          flow: boolean;
          forwardOnly?: boolean;
        };
        deliveryControls?: {
          completionSetByContent: boolean;
          objectiveSetByContent: boolean;
        };
      };
      prerequisites?: string[];
      resourceId?: string;
      children?: any[];
    }>;
  };
  resources: Array<{
    identifier: string;
    type: string;
    href?: string;
    scormType?: string;
    files: Array<{
      href: string;
      type?: string;
    }>;
    dependencies?: string[];
    metadata?: {
      description?: string;
      requirements?: string[];
    };
  }>;
}

function findStartingPage(resources: ManifestResult['resources']): string | undefined {
  // Look for SCO resource first
  const scoResource = resources.find(r => 
    r.scormType?.toLowerCase() === 'sco' && r.href
  );
  
  if (scoResource?.href) {
    return scoResource.href;
  }

  // Fallback to first resource with href
  return resources.find(r => r.href)?.href;
}

export async function parseManifest(manifestContent: string): Promise<ManifestResult> {
  console.log('Starting manifest parsing...');
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(manifestContent, 'text/xml');
    
    if (!doc) {
      throw new Error('Failed to parse manifest XML');
    }

    const manifestElement = doc.querySelector('manifest');
    if (!manifestElement) {
      throw new Error('Invalid manifest: No manifest element found');
    }

    console.log('Manifest element found, detecting SCORM version...');
    const scormVersion = detectScormVersion(manifestElement);
    console.log('Detected SCORM version:', scormVersion);

    // Parse main sections
    const metadata = parseMetadata(manifestElement.querySelector('metadata'));
    const organizations = parseOrganizations(manifestElement.querySelector('organizations'));
    const resources = parseResources(manifestElement.querySelector('resources'));
    
    // Find starting page
    const startingPage = findStartingPage(resources);
    console.log('Starting page:', startingPage);

    // Get prerequisites from organizations
    const prerequisites = organizations.items
      .flatMap(item => item.prerequisites || [])
      .filter(Boolean);

    // Get title from organizations or metadata
    const title = organizations.items[0]?.title || 
                 metadata.title ||
                 'Untitled Course';

    const result: ManifestResult = {
      title,
      version: metadata.schemaVersion,
      scormVersion,
      status: 'processed',
      startingPage,
      prerequisites: prerequisites.length > 0 ? prerequisites : undefined,
      metadata,
      organizations,
      resources
    };

    console.log('Successfully parsed manifest:', result);
    return result;

  } catch (error) {
    console.error('Error parsing manifest:', error);
    throw new Error(`Failed to parse manifest: ${error.message}`);
  }
}