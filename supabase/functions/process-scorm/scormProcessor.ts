import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import JSZip from 'https://esm.sh/jszip@3.10.1'
import { uploadFile } from './fileUtils.ts'

export async function processZipContent(
  zip: JSZip,
  supabase: any,
  courseId: string
): Promise<{ indexHtmlPath: string | null, originalIndexPath: string | null }> {
  let indexHtmlPath = null;
  let originalIndexPath = null;

  const unzippedDirPath = `Courses/${courseId}/unzipped`;
  console.log('Base unzipped directory path:', unzippedDirPath);

  // Get all files from the zip
  const files = Object.keys(zip.files);
  console.log('Total files in zip:', files.length);

  // Process each file in the zip, maintaining folder structure
  for (const relativePath of files) {
    const file = zip.files[relativePath];
    
    // Skip directories
    if (file.dir) {
      console.log('Skipping directory:', relativePath);
      continue;
    }

    console.log('Processing file:', relativePath);

    try {
      // Preserve the exact path structure from the zip
      const originalPath = `${unzippedDirPath}/${relativePath}`;
      console.log('Target storage path:', originalPath);

      // Get file content as ArrayBuffer
      const content = await file.async('arraybuffer');

      // Upload the file with its exact path structure
      await uploadFile(supabase, originalPath, content);
      console.log('Successfully uploaded file to:', originalPath);

      // Check if this is an index.html file and store its path
      if (relativePath.toLowerCase().endsWith('index.html')) {
        originalIndexPath = originalPath;
        indexHtmlPath = originalPath;
        console.log('Found index.html at:', originalPath);
      }
    } catch (error) {
      console.error(`Error processing file ${relativePath}:`, error);
      throw new Error(`Failed to process file ${relativePath}: ${error.message}`);
    }
  }

  if (!originalIndexPath) {
    console.warn('No index.html found in the SCORM package');
  } else {
    console.log('Final index.html path:', originalIndexPath);
  }

  return { indexHtmlPath, originalIndexPath };
}