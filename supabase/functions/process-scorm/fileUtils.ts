import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

export async function downloadZipFile(supabase: any, path: string): Promise<ArrayBuffer> {
  console.log('Downloading zip file from:', path);
  
  const { data, error } = await supabase.storage
    .from('scorm_packages')
    .download(path);

  if (error) {
    console.error('Error downloading zip file:', error);
    throw new Error(`Failed to download zip file: ${error.message}`);
  }

  return await data.arrayBuffer();
}

export async function uploadFile(
  supabase: any,
  path: string,
  content: ArrayBuffer,
): Promise<void> {
  console.log('Uploading file to:', path);

  const { error } = await supabase.storage
    .from('scorm_packages')
    .upload(path, content, {
      upsert: true, // Allow overwriting existing files
      contentType: 'application/octet-stream' // Generic binary content type
    });

  if (error) {
    console.error('Error uploading file:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  console.log('File uploaded successfully:', path);
}