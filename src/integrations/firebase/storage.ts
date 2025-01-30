import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage } from './config';

export async function uploadScormToFirebase(
  courseId: string,
  zipFile: File
): Promise<{ uploadedFiles: string[], indexPath: string | null }> {
  console.log('Starting SCORM upload to Firebase', {
    courseId,
    fileName: zipFile.name,
    fileSize: zipFile.size
  });
  
  try {
    // Get storage instance and verify it's initialized
    const storage = getFirebaseStorage();
    console.log('Firebase storage instance obtained:', !!storage);

    // Upload the zip file directly first
    const zipStoragePath = `courses/${courseId}/original/${zipFile.name}`;
    const zipFileRef = ref(storage, zipStoragePath);
    
    console.log('Starting ZIP file upload to:', zipStoragePath);
    
    // Track upload progress
    const uploadTask = uploadBytes(zipFileRef, zipFile, {
      contentType: 'application/zip'
    });

    // Log upload progress
    console.log('Upload task created, waiting for completion...');
    
    const uploadResult = await uploadTask;
    
    console.log('ZIP file upload completed successfully:', {
      fullPath: uploadResult.ref.fullPath,
      contentType: uploadResult.metadata.contentType,
      size: uploadResult.metadata.size,
      generation: uploadResult.metadata.generation,
      timeCreated: uploadResult.metadata.timeCreated
    });

    console.log('Generating download URL...');
    const downloadUrl = await getDownloadURL(uploadResult.ref);
    console.log('ZIP file download URL generated:', downloadUrl);

    // For now, return minimal response until we implement unzipping
    return {
      uploadedFiles: [downloadUrl],
      indexPath: null
    };

  } catch (error) {
    console.error('Upload process failed:', error instanceof Error ? {
      message: error.message,
      stack: error.stack
    } : error);
    throw error;
  }
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