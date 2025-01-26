import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import JSZip from 'https://esm.sh/jszip@3.10.1'
import { getContentType, uploadFile } from './fileUtils.ts'

export async function processZipContent(
  zip: JSZip,
  supabase: any,
  courseId: string
): Promise<{ indexHtmlPath: string | null, originalIndexPath: string | null }> {
  let indexHtmlPath = null;
  let originalIndexPath = null;

  const unzippedDirPath = `Courses/${courseId}/unzipped`;

  // Process each file in the zip, maintaining folder structure
  for (const [relativePath, file] of Object.entries(zip.files)) {
    // Skip macOS metadata files and directories
    if (file.dir || relativePath.startsWith('__MACOSX/')) {
      console.log('Skipping directory or macOS file:', relativePath);
      continue;
    }

    console.log('Processing file:', relativePath);

    try {
      // Preserve the full path structure
      const originalPath = `${unzippedDirPath}/${relativePath}`;
      const contentType = getContentType(relativePath);

      let content: ArrayBuffer;
      try {
        // Handle binary files directly as ArrayBuffer
        if (contentType.includes('xml') || 
            contentType.includes('xsd') || 
            contentType.includes('image/') || 
            contentType.includes('application/octet-stream')) {
          content = await file.async('arraybuffer');
        } 
        // Handle text files
        else if (contentType.startsWith('text/') || 
                 contentType.includes('javascript') || 
                 contentType.includes('json')) {
          const text = await file.async('text');
          content = new TextEncoder().encode(text).buffer;
        } 
        // Default to binary for unknown types
        else {
          content = await file.async('arraybuffer');
        }

        // Upload the file with its full path structure
        await uploadFile(supabase, originalPath, content, contentType);
        console.log('Uploaded file to:', originalPath);

        // Check if this is an index.html file
        if (relativePath.toLowerCase().endsWith('index.html')) {
          originalIndexPath = originalPath;
          indexHtmlPath = originalPath;
          console.log('Found index.html at:', originalPath);
        }
      } catch (processError) {
        console.error(`Failed to process file ${relativePath}:`, processError);
        // Continue with other files even if one fails
        continue;
      }
    } catch (error) {
      console.error(`Error processing file ${relativePath}:`, error);
      throw new Error(`Failed to process file ${relativePath}: ${error.message}`);
    }
  }

  if (!originalIndexPath) {
    console.warn('No index.html found in the SCORM package');
  }

  return { indexHtmlPath, originalIndexPath };
}