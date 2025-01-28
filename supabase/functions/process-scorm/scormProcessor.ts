import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import JSZip from 'https://esm.sh/jszip@3.10.1'
import { uploadFile } from './fileUtils.ts'
import { parseManifest } from './manifestParser.ts'

export async function processZipContent(
  zip: JSZip,
  supabase: any,
  courseId: string
): Promise<{ 
  indexHtmlPath: string | null;
  originalIndexPath: string | null;
  manifestData: any;
}> {
  let indexHtmlPath = null;
  let originalIndexPath = null;
  let manifestData = null;

  const courseFilesPath = `Courses/${courseId}/course_files`;
  console.log('Base course files directory path:', courseFilesPath);

  // First, find and parse the manifest
  console.log('Looking for manifest file...');
  const manifestFile = Object.keys(zip.files).find(path => 
    path.toLowerCase().endsWith('imsmanifest.xml')
  );

  if (!manifestFile) {
    console.error('No manifest file found in package');
    throw new Error('Invalid SCORM package: Missing imsmanifest.xml');
  }

  console.log('Found manifest at:', manifestFile);
  const manifestContent = await zip.files[manifestFile].async('text');
  manifestData = await parseManifest(manifestContent);
  console.log('Parsed manifest data:', manifestData);

  // Get all files from the zip
  const files = Object.keys(zip.files);
  console.log('Total files in zip:', files.length);

  // Process each file in the zip, maintaining folder structure
  for (const relativePath of files) {
    const file = zip.files[relativePath];
    
    // Skip directories and macOS metadata files
    if (file.dir || relativePath.startsWith('__MACOSX/') || relativePath.includes('/._')) {
      console.log('Skipping directory or metadata file:', relativePath);
      continue;
    }

    console.log('Processing file:', relativePath);

    try {
      // Remove any potential parent folder from the zip structure
      const pathParts = relativePath.split('/');
      // Skip the first folder level if it exists
      const cleanPath = pathParts.length > 1 ? pathParts.slice(1).join('/') : relativePath;
      
      // Construct the final path without the zip name folder
      const originalPath = `${courseFilesPath}/${cleanPath}`;
      console.log('Target storage path:', originalPath);

      // Get file content as ArrayBuffer
      const content = await file.async('arraybuffer');

      // Upload the file with its exact path structure
      await uploadFile(supabase, originalPath, content);
      console.log('Successfully uploaded file to:', originalPath);

      // Check if this is the starting page from manifest
      if (manifestData.startingPage && cleanPath.endsWith(manifestData.startingPage)) {
        originalIndexPath = originalPath;
        indexHtmlPath = originalPath;
        console.log('Found starting page at:', originalPath);
      }
      // Fallback to index.html if no starting page specified
      else if (!indexHtmlPath && cleanPath.toLowerCase().endsWith('index.html')) {
        originalIndexPath = originalPath;
        indexHtmlPath = originalPath;
        console.log('Found fallback index.html at:', originalPath);
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

  return { indexHtmlPath, originalIndexPath, manifestData };
}