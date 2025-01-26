export interface ScormManifest {
  version?: string;
  title?: string;
  description?: string;
  startingPage?: string;
  prerequisites?: string[];
}

class ManifestParser {
  static async parse(xmlString: string): Promise<ScormManifest> {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      
      // Check for XML parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Invalid XML format in manifest');
      }

      // Get SCORM version
      const schemaVersion = xmlDoc.querySelector('schemaversion');
      const version = schemaVersion ? schemaVersion.textContent : undefined;

      // Get title
      const titleElement = xmlDoc.querySelector('title');
      const title = titleElement ? titleElement.textContent : undefined;

      // Get description
      const descriptionElement = xmlDoc.querySelector('description');
      const description = descriptionElement ? descriptionElement.textContent : undefined;

      // Get starting page with more robust search
      const resourceElement = xmlDoc.querySelector('resource[href], resource[base]');
      let startingPage = undefined;
      
      if (resourceElement) {
        startingPage = resourceElement.getAttribute('href') || 
                      resourceElement.getAttribute('base') || 
                      undefined;
      }

      // Get prerequisites with validation
      const prerequisitesElements = xmlDoc.querySelectorAll('prerequisites');
      const prerequisites = Array.from(prerequisitesElements)
        .map(el => el.textContent || '')
        .filter(text => text.length > 0); // Filter out empty strings

      // Validate required fields
      if (!title) {
        console.warn('Manifest missing title');
      }

      if (!startingPage) {
        console.warn('Manifest missing starting page');
      }

      return {
        version,
        title,
        description,
        startingPage,
        prerequisites: prerequisites.length > 0 ? prerequisites : undefined
      };
    } catch (error) {
      console.error('Error parsing manifest:', error);
      throw new Error('Failed to parse SCORM manifest: ' + (error as Error).message);
    }
  }
}

export default ManifestParser;