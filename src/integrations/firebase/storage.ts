import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage } from './config';
import JSZip from 'jszip';

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

    // Extract zip contents
    console.log('Starting ZIP extraction...');
    const zip = await JSZip.loadAsync(zipFile);
    console.log('ZIP loaded successfully');
    
    const uploadedFiles: string[] = [];
    let indexPath: string | null = null;

    // Process each file in the zip
    const entries = Object.entries(zip.files);
    console.log(`Found ${entries.length} files in ZIP:`, 
      entries.map(([path]) => path).join(', ')
    );

    for (const [relativePath, file] of entries) {
      // Skip directories and macOS system files
      if (file.dir || relativePath.startsWith('__MACOSX/') || relativePath.startsWith('._')) {
        console.log(`Skipping file: ${relativePath} (directory or system file)`);
        continue;
      }

      try {
        console.log(`Processing file: ${relativePath}`);
        const content = await file.async('arraybuffer');
        console.log(`File ${relativePath} extracted, size: ${content.byteLength} bytes`);
        
        const storagePath = `courses/${courseId}/${relativePath}`;
        const fileRef = ref(storage, storagePath);
        console.log(`Created storage reference for path: ${storagePath}`);
        
        const contentType = getContentType(relativePath);
        console.log(`Uploading ${relativePath} with content type: ${contentType}`);
        
        // Upload the file
        const uploadResult = await uploadBytes(fileRef, content, {
          contentType
        });
        console.log(`Upload successful for ${relativePath}:`, {
          fullPath: uploadResult.ref.fullPath,
          contentType: uploadResult.metadata.contentType,
          size: uploadResult.metadata.size
        });
        
        const downloadUrl = await getDownloadURL(fileRef);
        console.log(`Download URL obtained for ${relativePath}: ${downloadUrl}`);
        uploadedFiles.push(downloadUrl);

        // Check if this is an index file
        if (relativePath.toLowerCase().includes('index.html')) {
          indexPath = downloadUrl;
          console.log('Found index file:', downloadUrl);
        }
      } catch (error) {
        console.error(`Error uploading ${relativePath}:`, error);
        throw new Error(`Failed to upload ${relativePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('Upload completed successfully', {
      totalFiles: uploadedFiles.length,
      indexPath,
      courseId,
      uploadedPaths: uploadedFiles
    });

    return { uploadedFiles, indexPath };
  } catch (error) {
    console.error('Upload process failed:', error);
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