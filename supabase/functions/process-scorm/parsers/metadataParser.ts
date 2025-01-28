interface MetadataResult {
  schema?: string;
  schemaVersion?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  version?: string;
  duration?: string;
  copyright?: string;
}

export function parseMetadata(metadataElement: Element | null): MetadataResult {
  if (!metadataElement) return {};

  const result: MetadataResult = {
    schema: metadataElement.querySelector('schema')?.textContent,
    schemaVersion: metadataElement.querySelector('schemaversion')?.textContent,
    keywords: Array.from(metadataElement.querySelectorAll('keyword string'))
      .map(k => k.textContent || '')
      .filter(Boolean)
  };

  // Parse LOM metadata if present
  const lomElement = metadataElement.querySelector('lom\\:lom, lom');
  if (lomElement) {
    const general = lomElement.querySelector('lom\\:general, general');
    if (general) {
      result.title = general.querySelector('lom\\:title string, title string')?.textContent;
      result.description = general.querySelector('lom\\:description string, description string')?.textContent;
    }

    const lifecycle = lomElement.querySelector('lom\\:lifecycle, lifecycle');
    if (lifecycle) {
      result.version = lifecycle.querySelector('lom\\:version string, version string')?.textContent;
    }

    const technical = lomElement.querySelector('lom\\:technical, technical');
    if (technical) {
      result.duration = technical.querySelector('lom\\:duration, duration')?.textContent;
    }

    const rights = lomElement.querySelector('lom\\:rights, rights');
    if (rights) {
      result.copyright = rights.querySelector('lom\\:description string, description string')?.textContent;
    }
  }

  return result;
}