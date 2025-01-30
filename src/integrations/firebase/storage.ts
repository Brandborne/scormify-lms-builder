import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';
import JSZip from 'jszip';

export async function uploadScormToFirebase(
  courseId: string,
  zipFile: File
): Promise<{ uploadedFiles: string[], indexPath: string | null }> {
  console.log('Starting SCORM upload to Firebase');
  
  // Extract zip contents
  const zip = await JSZip.loadAsync(zipFile);
  const uploadedFiles: string[] = [];
  let indexPath: string | null = null;

  // Process each file in the zip
  for (const [relativePath, file] of Object.entries(zip.files)) {
    if (file.dir) continue;

    try {
      const content = await file.async('arraybuffer');
      const storagePath = `courses/${courseId}/${relativePath}`;
      const fileRef = ref(storage, storagePath);
      
      // Upload the file
      await uploadBytes(fileRef, content, {
        contentType: getContentType(relativePath)
      });
      
      const downloadUrl = await getDownloadURL(fileRef);
      uploadedFiles.push(downloadUrl);

      // Check if this is an index file
      if (relativePath.toLowerCase().includes('index.html')) {
        indexPath = downloadUrl;
      }

      console.log(`Uploaded: ${relativePath}`);
    } catch (error) {
      console.error(`Error uploading ${relativePath}:`, error);
      throw error;
    }
  }

  return { uploadedFiles, indexPath };
}

function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'html': 'text/html',
    'htm': 'text/html',
    'js': 'application/javascript',
    'css': 'text/css',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'xml': 'application/xml',
    'json': 'application/json'
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}