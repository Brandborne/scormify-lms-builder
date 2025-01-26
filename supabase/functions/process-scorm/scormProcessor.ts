import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import JSZip from 'https://esm.sh/jszip@3.10.1'
import { getContentType, uploadFile } from './fileUtils.ts'

export async function processZipContent(
  zip: JSZip,
  supabase: any,
  unzippedDirPath: string,
  compiledDirPath: string
): Promise<{ indexHtmlPath: string | null, originalIndexPath: string | null }> {
  let indexHtmlPath = null
  let originalIndexPath = null

  for (const [filename, file] of Object.entries(zip.files)) {
    if (file.dir) continue

    const cleanFilename = filename.split('/').pop() || filename
    const originalPath = `${unzippedDirPath}/${cleanFilename}`
    const contentType = getContentType(cleanFilename)

    if (cleanFilename.toLowerCase() === 'index.html') {
      originalIndexPath = originalPath
      console.log('Found original index.html at:', originalPath)
    }

    try {
      let content: ArrayBuffer
      if (contentType.startsWith('text/') || contentType.includes('xml') || contentType.includes('javascript') || contentType.includes('json')) {
        const text = await file.async('text')
        content = new TextEncoder().encode(text).buffer
      } else {
        content = await file.async('arraybuffer')
      }

      await uploadFile(supabase, originalPath, content, contentType)

      if (!filename.endsWith('.ts') && !filename.endsWith('.jsx') && !filename.endsWith('.tsx')) {
        const compiledPath = `${compiledDirPath}/${cleanFilename}`
        await uploadFile(supabase, compiledPath, content, contentType)

        if (cleanFilename.toLowerCase() === 'index.html') {
          indexHtmlPath = compiledPath
          console.log('Set compiled index.html path:', compiledPath)
        }
      }
    } catch (error) {
      console.error(`Failed to process file ${cleanFilename}:`, error)
      throw new Error(`Failed to process file ${cleanFilename}: ${error.message}`)
    }
  }

  return { indexHtmlPath, originalIndexPath }
}

export async function updateCourseMetadata(
  supabase: any,
  courseId: string,
  unzippedDirPath: string,
  compiledDirPath: string,
  indexHtmlPath: string,
  originalIndexPath: string
) {
  const { error: updateError } = await supabase
    .from('courses')
    .update({
      manifest_data: {
        status: 'processed',
        unzipped_path: unzippedDirPath,
        compiled_path: compiledDirPath,
        index_path: indexHtmlPath,
        original_index_path: originalIndexPath
      }
    })
    .eq('id', courseId)

  if (updateError) {
    console.error('Error updating course:', updateError)
    throw new Error(`Failed to update course: ${updateError.message}`)
  }
}