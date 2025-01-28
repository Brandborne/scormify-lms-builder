export async function parseManifest(xmlContent: string): Promise<any> {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      console.error('XML Parse Error:', parseError.textContent);
      throw new Error('Invalid manifest XML format');
    }

    // Determine SCORM version
    const metadata = xmlDoc.querySelector('metadata');
    const schemaVersion = xmlDoc.querySelector('schemaversion');
    let scormVersion = 'SCORM 1.2'; // Default version

    if (metadata) {
      const schema = metadata.querySelector('schema');
      if (schema && schema.textContent?.includes('2004')) {
        scormVersion = 'SCORM 2004';
      }
    }

    console.log('Detected SCORM version:', scormVersion);

    // Get basic metadata
    const title = xmlDoc.querySelector('organization > title')?.textContent || 
                 xmlDoc.querySelector('title')?.textContent;
    const description = xmlDoc.querySelector('description')?.textContent;

    // Parse organizations (course structure)
    const organizations: any[] = [];
    const orgs = xmlDoc.querySelectorAll('organizations > organization');
    orgs.forEach(org => {
      const items: any[] = [];
      org.querySelectorAll('item').forEach(item => {
        items.push({
          identifier: item.getAttribute('identifier'),
          title: item.querySelector('title')?.textContent,
          launch: item.getAttribute('identifierref')
        });
      });

      organizations.push({
        identifier: org.getAttribute('identifier'),
        title: org.querySelector('title')?.textContent,
        items
      });
    });

    // Find starting page
    let startingPage = null;
    const defaultOrg = xmlDoc.querySelector('organizations')?.getAttribute('default');
    const firstItem = defaultOrg ? 
      xmlDoc.querySelector(`organization[identifier="${defaultOrg}"] item[identifierref]`) :
      xmlDoc.querySelector('item[identifierref]');
    
    if (firstItem) {
      const resourceId = firstItem.getAttribute('identifierref');
      const resource = xmlDoc.querySelector(`resource[identifier="${resourceId}"]`);
      startingPage = resource?.getAttribute('href') || null;
    }

    // If no starting page found in organization, look for first resource with href
    if (!startingPage) {
      const firstResource = xmlDoc.querySelector('resource[href]');
      startingPage = firstResource?.getAttribute('href') || null;
    }

    console.log('Found starting page:', startingPage);

    // Parse resources
    const resources: any[] = [];
    xmlDoc.querySelectorAll('resource').forEach(resource => {
      resources.push({
        identifier: resource.getAttribute('identifier'),
        type: resource.getAttribute('type'),
        href: resource.getAttribute('href'),
        dependencies: Array.from(resource.querySelectorAll('dependency'))
          .map(dep => dep.getAttribute('identifierref'))
          .filter(Boolean)
      });
    });

    const manifestData = {
      scormVersion,
      title,
      description,
      startingPage,
      organizations,
      resources,
      status: 'pending_processing'
    };

    console.log('Parsed manifest data:', manifestData);
    return manifestData;

  } catch (error) {
    console.error('Error parsing manifest:', error);
    throw new Error(`Failed to parse manifest: ${error.message}`);
  }
}