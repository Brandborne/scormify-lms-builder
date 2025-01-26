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
      
      // Get SCORM version
      const schemaVersion = xmlDoc.querySelector('schemaversion');
      const version = schemaVersion ? schemaVersion.textContent : undefined;

      // Get title
      const titleElement = xmlDoc.querySelector('title');
      const title = titleElement ? titleElement.textContent : undefined;

      // Get description
      const descriptionElement = xmlDoc.querySelector('description');
      const description = descriptionElement ? descriptionElement.textContent : undefined;

      // Get starting page
      const resourceElement = xmlDoc.querySelector('resource[href]');
      const startingPage = resourceElement ? resourceElement.getAttribute('href') : undefined;

      // Get prerequisites
      const prerequisitesElements = xmlDoc.querySelectorAll('prerequisites');
      const prerequisites = Array.from(prerequisitesElements).map(el => el.textContent || '');

      return {
        version,
        title,
        description,
        startingPage,
        prerequisites: prerequisites.length > 0 ? prerequisites : undefined
      };
    } catch (error) {
      console.error('Error parsing manifest:', error);
      throw new Error('Failed to parse SCORM manifest');
    }
  }
}

export default ManifestParser;