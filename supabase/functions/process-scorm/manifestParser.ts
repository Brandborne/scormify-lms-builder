import { parse as parseXML } from 'https://deno.land/x/xml@2.1.1/mod.ts';
import { parseMetadata } from './parsers/metadataParser.ts';
import { parseOrganizations } from './parsers/organizationsParser.ts';
import { parseResources } from './parsers/resourcesParser.ts';
import { detectScormVersion } from './parsers/versionParser.ts';

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

export async function parseManifest(manifestContent: string): Promise<ManifestResult> {
  console.log('Starting manifest parsing...');
  
  try {
    // Parse XML content using deno-xml-parser
    const xmlObj = parseXML(manifestContent);
    console.log('Successfully parsed XML:', xmlObj);

    if (!xmlObj || !xmlObj.manifest) {
      throw new Error('Invalid manifest: No manifest element found');
    }

    const manifest = xmlObj.manifest;
    console.log('Manifest element found, detecting SCORM version...');
    
    const scormVersion = detectScormVersion(manifest);
    console.log('Detected SCORM version:', scormVersion);

    // Parse main sections
    const metadata = parseMetadata(manifest.metadata);
    const organizations = parseOrganizations(manifest.organizations);
    const resources = parseResources(manifest.resources);

    // Find starting page from resources
    const startingPage = resources.find(r => 
      r.scormType?.toLowerCase() === 'sco' && r.href
    )?.href || resources[0]?.href;

    // Extract prerequisites from organizations
    const prerequisites = organizations.items
      .flatMap(item => item.prerequisites || [])
      .filter(Boolean);

    const result: ManifestResult = {
      title: organizations.items[0]?.title || metadata.title || 'Untitled Course',
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