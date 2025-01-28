import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';

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

export async function parseManifest(xmlString: string): Promise<ScormManifest> {
  console.log('Starting manifest parsing with XML length:', xmlString.length);
  console.log('First 500 chars of manifest:', xmlString.substring(0, 500));
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    if (!xmlDoc) {
      console.error('Failed to parse XML document');
      throw new Error('Failed to parse XML document');
    }

    // Check for XML parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      console.error('XML Parse Error:', parseError.textContent);
      throw new Error(`Invalid XML format in manifest: ${parseError.textContent}`);
    }

    // Get manifest element and log its structure
    const manifest = xmlDoc.documentElement;
    console.log('Manifest element found:', manifest.tagName);
    console.log('Manifest attributes:', Array.from(manifest.attributes).map(attr => `${attr.name}=${attr.value}`));

    // Determine SCORM version from metadata or namespace
    let scormVersion = 'SCORM 1.2'; // Default version
    const metadata = manifest.querySelector('metadata');
    if (metadata) {
      const schema = metadata.querySelector('schema')?.textContent;
      console.log('Schema found in metadata:', schema);
      if (schema?.includes('2004')) {
        scormVersion = 'SCORM 2004';
      }
    }

    // Parse title with multiple fallbacks
    const title = getFirstMatchingElement(manifest, [
      'organization > title',
      'organizations > organization > title',
      'metadata > title',
      'title'
    ])?.textContent?.trim() || 'Untitled Course';
    console.log('Parsed title:', title);

    // Parse description
    const description = getFirstMatchingElement(manifest, [
      'description',
      'metadata > description',
      'organization > description'
    ])?.textContent?.trim();
    console.log('Parsed description:', description);

    // Parse organizations
    const organizations = parseOrganizations(manifest);
    console.log('Parsed organizations:', organizations);

    // Parse resources
    const resources = parseResources(manifest);
    console.log('Parsed resources:', resources);

    // Find starting page
    const startingPage = findStartingPage(resources, organizations);
    console.log('Found starting page:', startingPage);

    // Parse prerequisites
    const prerequisites = Array.from(manifest.querySelectorAll('prerequisites'))
      .map(el => el.textContent?.trim())
      .filter((text): text is string => !!text);
    console.log('Found prerequisites:', prerequisites);

    const result: ScormManifest = {
      version: manifest.getAttribute('version') || undefined,
      title,
      description,
      startingPage,
      prerequisites: prerequisites.length > 0 ? prerequisites : undefined,
      scormVersion,
      organizations,
      resources
    };

    console.log('Final parsed manifest:', JSON.stringify(result, null, 2));
    return result;

  } catch (error) {
    console.error('Error parsing manifest:', error);
    throw new Error(`Failed to parse SCORM manifest: ${error.message}`);
  }
}

function getFirstMatchingElement(root: Element, selectors: string[]): Element | null {
  for (const selector of selectors) {
    const element = root.querySelector(selector);
    if (element) {
      console.log(`Found element using selector "${selector}":`, element.textContent);
      return element;
    }
  }
  return null;
}

function parseOrganizations(manifest: Element) {
  console.log('Parsing organizations...');
  const orgsElement = manifest.querySelector('organizations');
  if (!orgsElement) {
    console.log('No organizations element found');
    return { default: '', items: [] };
  }

  const defaultOrg = orgsElement.getAttribute('default') || '';
  const items = Array.from(orgsElement.querySelectorAll('organization')).map(org => {
    const identifier = org.getAttribute('identifier') || '';
    const title = org.querySelector('title')?.textContent?.trim() || '';
    const items = Array.from(org.querySelectorAll('item')).map(item => ({
      identifier: item.getAttribute('identifier') || '',
      title: item.querySelector('title')?.textContent?.trim() || '',
      launch: item.getAttribute('identifierref')
    }));

    console.log('Parsed organization:', { identifier, title, items });
    return { identifier, title, items };
  });

  return { default: defaultOrg, items };
}

function parseResources(manifest: Element) {
  console.log('Parsing resources...');
  const resources = Array.from(manifest.querySelectorAll('resource')).map(resource => {
    const parsed = {
      identifier: resource.getAttribute('identifier') || '',
      type: resource.getAttribute('type') || '',
      href: resource.getAttribute('href'),
      dependencies: Array.from(resource.querySelectorAll('dependency'))
        .map(dep => dep.getAttribute('identifierref'))
        .filter((id): id is string => !!id)
    };
    console.log('Parsed resource:', parsed);
    return parsed;
  });

  return resources;
}

function findStartingPage(
  resources: Array<{ identifier: string; type: string; href?: string }>,
  organizations: { default: string; items: Array<any> }
): string | undefined {
  console.log('Finding starting page...');
  
  // First try to find it in organizations
  if (organizations.default && organizations.items.length > 0) {
    const defaultOrg = organizations.items.find(org => 
      org.identifier === organizations.default
    );
    if (defaultOrg?.items?.[0]?.launch) {
      const resource = resources.find(r => r.identifier === defaultOrg.items[0].launch);
      if (resource?.href) {
        console.log('Found starting page in default organization:', resource.href);
        return resource.href;
      }
    }
  }

  // Then look for first resource with href
  const firstResourceWithHref = resources.find(r => r.href);
  if (firstResourceWithHref?.href) {
    console.log('Using first resource with href as starting page:', firstResourceWithHref.href);
    return firstResourceWithHref.href;
  }

  console.log('No starting page found');
  return undefined;
}