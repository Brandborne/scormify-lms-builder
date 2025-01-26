import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

export function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const contentTypes: { [key: string]: string } = {
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'xsd': 'application/xml',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'pdf': 'application/pdf',
    'zip': 'application/zip',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject',
  }
  
  return contentTypes[ext] || 'application/octet-stream'
}

export async function downloadZipFile(supabase: any, filePath: string): Promise<ArrayBuffer> {
  console.log('Attempting to download file:', filePath)
  
  const { data, error } = await supabase
    .storage
    .from('scorm_packages')
    .download(filePath)

  if (error) {
    console.error('Error downloading file:', error)
    throw new Error(`Failed to download file: ${error.message}`)
  }

  if (!data) {
    throw new Error('No data received from storage')
  }

  return await data.arrayBuffer()
}

export async function uploadFile(
  supabase: any,
  path: string,
  content: ArrayBuffer,
  contentType: string
): Promise<void> {
  const { error: uploadError } = await supabase
    .storage
    .from('scorm_packages')
    .upload(path, content, {
      contentType,
      upsert: true,
      cacheControl: '3600',
      duplex: 'half'
    })

  if (uploadError) {
    console.error('Error uploading file:', path, uploadError)
    throw uploadError
  }

  // After upload, ensure the file is publicly accessible
  const { error: updateError } = await supabase
    .storage
    .from('scorm_packages')
    .update(path, content, {
      contentType,
      cacheControl: '3600',
      upsert: true
    })

  if (updateError) {
    console.error('Error updating file permissions:', path, updateError)
    throw updateError
  }

  console.log('Successfully uploaded and configured file:', path)
}