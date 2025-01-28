export function parseMetadata(metadataNode: any): any {
  console.log('Parsing metadata from node:', JSON.stringify(metadataNode, null, 2));
  
  if (!metadataNode) {
    console.log('No metadata node found');
    return {};
  }

  // Handle both namespaced and non-namespaced nodes
  const title = metadataNode?.['title']?.[0]?.['#text'] || 
                metadataNode?.['adlcp:title']?.[0]?.['#text'];
                
  const description = metadataNode?.['description']?.[0]?.['#text'] || 
                     metadataNode?.['adlcp:description']?.[0]?.['#text'];

  const result = {
    title,
    description,
    version: metadataNode?.['version']?.[0]?.['#text']
  };

  // Remove undefined properties
  Object.keys(result).forEach(key => 
    result[key] === undefined && delete result[key]
  );

  console.log('Parsed metadata:', JSON.stringify(result, null, 2));
  return result;
}