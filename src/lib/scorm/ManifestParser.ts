export interface ScormManifest {
  version?: string;
  title?: string;
  description?: string;
  startingPage?: string;
  prerequisites?: string[];
  scormVersion?: string;
  organizations?: {
    default: string;
    items: Array<{
      identifier: string;
      title: string;
      items?: Array<{
        identifier: string;
        title: string;
        launch?: string;
      }>;
    }>;
  };
  resources?: Array<{
    identifier: string;
    type: string;
    href?: string;
    dependencies?: string[];
  }>;
}

class ManifestParser {
  static async parse(xmlString: string): Promise<ScormManifest> {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      
      // Check for XML parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        console.error('XML Parse Error:', parseError.textContent);
        throw new Error('Invalid XML format in manifest');
      }

      // Determine SCORM version
      const metadata = xmlDoc.querySelector('metadata');
      const schemaVersion = xmlDoc.querySelector('schemaversion');
      let version = schemaVersion ? schemaVersion.textContent : undefined;
      let scormVersion = 'SCORM 1.2'; // Default to SCORM 1.2

      if (metadata) {
        const schema = metadata.querySelector('schema');
        if (schema && schema.textContent?.includes('SCORM')) {
          scormVersion = schema.textContent;
        }
      }

      // Get title with fallback options
      const titleElement = xmlDoc.querySelector('organization > title') || 
                          xmlDoc.querySelector('title');
      const title = titleElement ? titleElement.textContent : undefined;

      // Get description
      const descriptionElement = xmlDoc.querySelector('description');
      const description = descriptionElement ? descriptionElement.textContent : undefined;

      // Parse organizations (course structure)
      const organizations: ScormManifest['organizations'] = {
        default: '',
        items: []
      };

      const organizationsElement = xmlDoc.querySelector('organizations');
      if (organizationsElement) {
        organizations.default = organizationsElement.getAttribute('default') || '';
        
        const orgElements = organizationsElement.querySelectorAll('organization');
        orgElements.forEach(org => {
          const orgItem = {
            identifier: org.getAttribute('identifier') || '',
            title: org.querySelector('title')?.textContent || '',
            items: []
          };

          const items = org.querySelectorAll('item');
          items.forEach(item => {
            orgItem.items?.push({
              identifier: item.getAttribute('identifier') || '',
              title: item.querySelector('title')?.textContent || '',
              launch: item.getAttribute('identifierref') || undefined
            });
          });

          organizations.items.push(orgItem);
        });
      }

      // Find starting page
      let startingPage: string | undefined;

      // First try to find it in organizations
      const defaultOrg = organizations.items.find(org => 
        org.identifier === organizations.default
      );
      if (defaultOrg?.items?.[0]?.launch) {
        const resourceElement = xmlDoc.querySelector(
          `resource[identifier="${defaultOrg.items[0].launch}"]`
        );
        startingPage = resourceElement?.getAttribute('href') || undefined;
      }

      // If not found, look in resources
      if (!startingPage) {
        const resourceElement = xmlDoc.querySelector('resource[href]');
        startingPage = resourceElement?.getAttribute('href') || undefined;
      }

      // Parse resources
      const resources: ScormManifest['resources'] = [];
      const resourceElements = xmlDoc.querySelectorAll('resource');
      resourceElements.forEach(resource => {
        resources.push({
          identifier: resource.getAttribute('identifier') || '',
          type: resource.getAttribute('type') || '',
          href: resource.getAttribute('href') || undefined,
          dependencies: Array.from(resource.querySelectorAll('dependency'))
            .map(dep => dep.getAttribute('identifierref') || '')
            .filter(Boolean)
        });
      });

      // Get prerequisites
      const prerequisitesElements = xmlDoc.querySelectorAll('prerequisites');
      const prerequisites = Array.from(prerequisitesElements)
        .map(el => el.textContent || '')
        .filter(text => text.length > 0);

      // Log parsing results for debugging
      console.log('Manifest parsing results:', {
        version,
        scormVersion,
        title,
        description,
        startingPage,
        organizations,
        resources
      });

      // Validate required fields
      if (!title) {
        console.warn('Manifest missing title');
      }

      if (!startingPage) {
        console.warn('Manifest missing starting page');
      }

      return {
        version,
        scormVersion,
        title,
        description,
        startingPage,
        prerequisites: prerequisites.length > 0 ? prerequisites : undefined,
        organizations,
        resources
      };
    } catch (error) {
      console.error('Error parsing manifest:', error);
      throw new Error('Failed to parse SCORM manifest: ' + (error as Error).message);
    }
  }
}

export default ManifestParser;