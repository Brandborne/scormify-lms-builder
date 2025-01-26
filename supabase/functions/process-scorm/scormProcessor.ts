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
  const compiledDirPath = `Courses/${courseId}/compiled`;

  // Process each file in the zip, maintaining folder structure
  for (const [relativePath, file] of Object.entries(zip.files)) {
    if (file.dir) continue;

    console.log('Processing file:', relativePath);

    // Preserve the full path structure
    const originalPath = `${unzippedDirPath}/${relativePath}`;
    const contentType = getContentType(relativePath);

    try {
      let content: ArrayBuffer;
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
        indexHtmlPath = `${compiledDirPath}/${relativePath}`;
        console.log('Found index.html at:', originalPath);
        
        // Also upload to compiled path
        await uploadFile(supabase, indexHtmlPath, content, contentType);
        console.log('Uploaded index.html to compiled path:', indexHtmlPath);
      }
    } catch (error) {
      console.error(`Failed to process file ${relativePath}:`, error);
      throw new Error(`Failed to process file ${relativePath}: ${error.message}`);
    }
  }

  if (!originalIndexPath) {
    console.error('No index.html found in the SCORM package');
  }

  return { indexHtmlPath, originalIndexPath };
}

export async function updateCourseMetadata(
  supabase: any,
  courseId: string,
  indexHtmlPath: string,
  originalIndexPath: string
) {
  console.log('Updating course metadata with paths:', {
    courseId,
    indexHtmlPath,
    originalIndexPath
  });

  const { error: updateError } = await supabase
    .from('courses')
    .update({
      manifest_data: {
        status: 'processed',
        index_path: indexHtmlPath,
        original_index_path: originalIndexPath
      }
    })
    .eq('id', courseId);

  if (updateError) {
    console.error('Error updating course:', updateError);
    throw new Error(`Failed to update course: ${updateError.message}`);
  }

  console.log('Course metadata updated successfully');
}