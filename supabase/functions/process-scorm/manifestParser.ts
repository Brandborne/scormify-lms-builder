import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';

interface ManifestResource {
  identifier: string;
  type: string;
  href?: string;
  dependencies?: string[];
}

interface ManifestOrganization {
  identifier: string;
  title?: string;
  items: Array<{
    identifier: string;
    title?: string;
    launch?: string;
  }>;
}

interface ManifestData {
  scormVersion: string;
  title?: string;
  description?: string;
  startingPage?: string;
  organizations?: {
    default: string;
    items: ManifestOrganization[];
  };
  resources?: ManifestResource[];
  status: 'pending_processing' | 'processed' | 'error';
}

export async function parseManifest(xmlContent: string): Promise<ManifestData> {
  try {
    console.log('Starting manifest parsing...');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

    if (!xmlDoc) {
      throw new Error('Failed to parse XML document');
    }

    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      console.error('XML Parse Error:', parseError.textContent);
      throw new Error('Invalid manifest XML format');
    }

    // Determine SCORM version
    let scormVersion = 'SCORM 1.2'; // Default version
    const metadata = xmlDoc.querySelector('metadata');
    const schemaVersion = xmlDoc.querySelector('schemaversion');

    if (metadata) {
      const schema = metadata.querySelector('schema');
      if (schema?.textContent?.includes('2004')) {
        scormVersion = 'SCORM 2004';
      }
    }

    console.log('Detected SCORM version:', scormVersion);

    // Get basic metadata with better error handling
    const title = xmlDoc.querySelector('organization > title')?.textContent || 
                 xmlDoc.querySelector('title')?.textContent;
    const description = xmlDoc.querySelector('description')?.textContent;

    // Parse organizations (course structure)
    const organizations: ManifestData['organizations'] = {
      default: '',
      items: []
    };

    const orgsElement = xmlDoc.querySelector('organizations');
    if (orgsElement) {
      organizations.default = orgsElement.getAttribute('default') || '';
      
      const orgElements = orgsElement.querySelectorAll('organization');
      orgElements.forEach(org => {
        const items: ManifestOrganization['items'] = [];
        
        org.querySelectorAll('item').forEach(item => {
          items.push({
            identifier: item.getAttribute('identifier') || '',
            title: item.querySelector('title')?.textContent,
            launch: item.getAttribute('identifierref')
          });
        });

        organizations.items.push({
          identifier: org.getAttribute('identifier') || '',
          title: org.querySelector('title')?.textContent,
          items
        });
      });
    }

    // Find starting page with improved logic
    let startingPage: string | undefined;

    // First try to find it in organizations
    if (organizations.default) {
      const defaultOrg = organizations.items.find(org => 
        org.identifier === organizations.default
      );
      if (defaultOrg?.items?.[0]?.launch) {
        const resourceElement = xmlDoc.querySelector(
          `resource[identifier="${defaultOrg.items[0].launch}"]`
        );
        startingPage = resourceElement?.getAttribute('href') || undefined;
      }
    }

    // Fallback: look in resources
    if (!startingPage) {
      const firstResource = xmlDoc.querySelector('resource[href]');
      startingPage = firstResource?.getAttribute('href') || undefined;
    }

    console.log('Found starting page:', startingPage);

    // Parse resources with better type handling
    const resources: ManifestResource[] = [];
    xmlDoc.querySelectorAll('resource').forEach(resource => {
      resources.push({
        identifier: resource.getAttribute('identifier') || '',
        type: resource.getAttribute('type') || '',
        href: resource.getAttribute('href'),
        dependencies: Array.from(resource.querySelectorAll('dependency'))
          .map(dep => dep.getAttribute('identifierref'))
          .filter((id): id is string => id !== null)
      });
    });

    const manifestData: ManifestData = {
      scormVersion,
      title,
      description,
      startingPage,
      organizations,
      resources,
      status: 'pending_processing'
    };

    console.log('Successfully parsed manifest data:', manifestData);
    return manifestData;

  } catch (error) {
    console.error('Error parsing manifest:', error);
    throw new Error(`Failed to parse manifest: ${error.message}`);
  }
}