import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import JSZip from 'https://esm.sh/jszip@3.10.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function downloadZipFile(supabase: any, filePath: string): Promise<ArrayBuffer> {
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

function getContentType(filename: string): string {
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
  }
  
  return contentTypes[ext] || 'application/octet-stream'
}

async function processZipContent(
  zip: JSZip,
  supabase: any,
  unzippedDirPath: string,
  compiledDirPath: string
): Promise<{ indexHtmlPath: string | null, originalIndexPath: string | null }> {
  let indexHtmlPath = null
  let originalIndexPath = null

  // First, store the original uncompiled files
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
        // Handle text files
        const text = await file.async('text')
        content = new TextEncoder().encode(text).buffer
      } else {
        // Handle binary files
        content = await file.async('arraybuffer')
      }

      const { error: uploadError } = await supabase
        .storage
        .from('scorm_packages')
        .upload(originalPath, content, {
          contentType,
          upsert: true
        })

      if (uploadError) {
        console.error('Error uploading original file:', cleanFilename, uploadError)
        throw uploadError
      }

      console.log('Successfully uploaded original file:', originalPath)

      // For compiled version, only process non-source files
      if (!filename.endsWith('.ts') && !filename.endsWith('.jsx') && !filename.endsWith('.tsx')) {
        const compiledPath = `${compiledDirPath}/${cleanFilename}`
        
        const { error: compiledUploadError } = await supabase
          .storage
          .from('scorm_packages')
          .upload(compiledPath, content, {
            contentType,
            upsert: true
          })

        if (compiledUploadError) {
          console.error('Error uploading compiled file:', cleanFilename, compiledUploadError)
          throw compiledUploadError
        }

        if (cleanFilename.toLowerCase() === 'index.html') {
          indexHtmlPath = compiledPath
          console.log('Set compiled index.html path:', compiledPath)
        }

        console.log('Successfully uploaded compiled file:', compiledPath)
      }
    } catch (error) {
      console.error(`Failed to process file ${cleanFilename}:`, error)
      throw new Error(`Failed to process file ${cleanFilename}: ${error.message}`)
    }
  }

  return { indexHtmlPath, originalIndexPath }
}

async function updateCourseMetadata(
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }

  try {
    // Validate request body
    const body = await req.json().catch(() => null)
    if (!body || !body.courseId) {
      throw new Error('Invalid request: courseId is required')
    }

    const { courseId } = body
    console.log('Processing SCORM package for course:', courseId)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (courseError) {
      console.error('Error fetching course:', courseError)
      throw new Error(`Failed to fetch course: ${courseError.message}`)
    }

    if (!course) {
      throw new Error('Course not found')
    }

    console.log('Found course:', course.title)
    console.log('Package path:', course.package_path)

    // Download and process the zip file
    const zipBuffer = await downloadZipFile(supabase, course.package_path)
    console.log('ZIP file downloaded, size:', zipBuffer.byteLength)

    const zip = new JSZip()
    const zipContent = await zip.loadAsync(zipBuffer)
    console.log('ZIP file loaded successfully')

    const unzippedDirPath = `${crypto.randomUUID()}`
    const compiledDirPath = `${crypto.randomUUID()}`
    
    const { indexHtmlPath, originalIndexPath } = await processZipContent(
      zip, 
      supabase, 
      unzippedDirPath,
      compiledDirPath
    )

    if (!indexHtmlPath || !originalIndexPath) {
      throw new Error('No index.html found in the SCORM package')
    }

    await updateCourseMetadata(
      supabase, 
      courseId, 
      unzippedDirPath, 
      compiledDirPath,
      indexHtmlPath,
      originalIndexPath
    )

    console.log('Course updated successfully with paths:', {
      unzippedPath: unzippedDirPath,
      compiledPath: compiledDirPath,
      indexPath: indexHtmlPath,
      originalIndexPath: originalIndexPath
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'SCORM package processed successfully',
        courseId,
        unzippedPath: unzippedDirPath,
        compiledPath: compiledDirPath,
        indexPath: indexHtmlPath,
        originalIndexPath: originalIndexPath
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Error processing SCORM package:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    )
  }
})