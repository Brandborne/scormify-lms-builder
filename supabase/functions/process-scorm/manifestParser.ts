import { parse as parseXML } from 'https://deno.land/x/xml@2.1.1/mod.ts';
import { parseObjectives } from './parsers/objectivesParser.ts';
import { parseSequencing } from './parsers/sequencingParser.ts';
import { parseResources } from './parsers/resourceParser.ts';
import { ScormManifest } from './types/manifest.ts';

export async function parseManifest(xmlString: string): Promise<ScormManifest> {
  try {
    console.log('Parsing manifest XML...');
    const xmlDoc = parseXML(xmlString);
    const manifest = xmlDoc.manifest;

    // Extract metadata
    const metadata = manifest.metadata?.[0];
    const schema = metadata?.schema?.[0]?.['#text'];
    const schemaVersion = metadata?.schemaversion?.[0]?.['#text'];

    // Extract organizations
    const organizations = manifest.organizations?.[0];
    const defaultOrg = organizations?.['$default'];
    const organization = organizations?.organization?.[0];

    // Process items
    const items = organization?.item || [];
    const processedItems = (Array.isArray(items) ? items : [items]).map(item => {
      const sequencing = item['imsss:sequencing']?.[0];
      return {
        identifier: item['$identifier'] || '',
        title: item.title?.[0]?.['#text'] || '',
        objectives: parseObjectives(sequencing?.['imsss:objectives']?.[0]),
        sequencing: parseSequencing(sequencing),
        resourceId: item['$identifierref']
      };
    });

    // Process resources
    const resources = manifest.resources?.[0]?.resource || [];
    const processedResources = parseResources(resources);

    // Determine SCORM version
    const scormVersion = schema?.includes('2004') ? 'SCORM 2004' : 'SCORM 1.2';

    console.log('Successfully parsed manifest:', {
      title: organization?.title?.[0]?.['#text'],
      metadata: { schema, schemaVersion },
      organizations: { default: defaultOrg, items: processedItems },
      resources: processedResources,
      sequencing: parseSequencing(organization?.['imsss:sequencing']?.[0])
    });

    return {
      title: organization?.title?.[0]?.['#text'],
      scormVersion,
      status: 'processed',
      metadata: {
        schema,
        schemaVersion,
        objectives: parseObjectives(organization?.['imsss:sequencing']?.[0]?.['imsss:objectives']?.[0])
      },
      organizations: {
        default: defaultOrg || '',
        items: processedItems
      },
      resources: processedResources,
      sequencing: parseSequencing(organization?.['imsss:sequencing']?.[0])
    };
  } catch (error) {
    console.error('Error parsing manifest:', error);
    throw new Error('Failed to parse SCORM manifest: ' + error.message);
  }
}