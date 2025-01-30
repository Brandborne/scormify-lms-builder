import { ref, uploadBytes, getDownloadURL, UploadMetadata } from 'firebase/storage';
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
    const storage = getFirebaseStorage();
    console.log('Firebase storage instance obtained');

    // Create metadata for the upload
    const metadata: UploadMetadata = {
      contentType: 'application/zip',
      customMetadata: {
        courseId,
        originalName: zipFile.name
      }
    };

    // Define the storage path
    const zipStoragePath = `courses/${courseId}/original/${zipFile.name}`;
    const zipFileRef = ref(storage, zipStoragePath);
    
    console.log('Uploading ZIP file to:', zipStoragePath);
    console.log('Starting uploadBytes operation...');
    
    try {
      // Upload the file with metadata
      const uploadResult = await uploadBytes(zipFileRef, zipFile, metadata);
      
      console.log('Upload completed successfully:', {
        fullPath: uploadResult.ref.fullPath,
        contentType: uploadResult.metadata.contentType,
        size: uploadResult.metadata.size,
        timeCreated: uploadResult.metadata.timeCreated
      });

      console.log('Generating download URL...');
      // Generate download URL
      const downloadUrl = await getDownloadURL(uploadResult.ref);
      console.log('Download URL generated:', downloadUrl);

      return {
        uploadedFiles: [downloadUrl],
        indexPath: null // Will be implemented when we add unzipping functionality
      };

    } catch (uploadError) {
      console.error('Upload operation failed:', {
        error: uploadError instanceof Error ? {
          name: uploadError.name,
          message: uploadError.message,
          stack: uploadError.stack
        } : uploadError,
        path: zipStoragePath
      });
      throw uploadError;
    }

  } catch (error) {
    console.error('Upload process failed:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      stage: 'initialization'
    });
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