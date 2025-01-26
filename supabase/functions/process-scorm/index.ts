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

async function processZipContent(
  zip: JSZip,
  supabase: any,
  unzippedDirPath: string
): Promise<string | null> {
  let indexHtmlPath = null

  for (const [filename, file] of Object.entries(zip.files)) {
    if (file.dir) continue

    const cleanFilename = filename.split('/').pop() || filename
    const uploadPath = `${unzippedDirPath}/${cleanFilename}`

    if (cleanFilename.toLowerCase() === 'index.html') {
      indexHtmlPath = uploadPath
      console.log('Found index.html at:', uploadPath)
    }

    const content = await file.async('arraybuffer')
    const { error: uploadError } = await supabase
      .storage
      .from('scorm_packages')
      .upload(uploadPath, content, {
        contentType: 'application/octet-stream',
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading file:', cleanFilename, uploadError)
      throw uploadError
    }

    console.log('Successfully uploaded:', uploadPath)
  }

  return indexHtmlPath
}

async function updateCourseMetadata(
  supabase: any,
  courseId: string,
  unzippedDirPath: string,
  indexHtmlPath: string
) {
  const { error: updateError } = await supabase
    .from('courses')
    .update({
      manifest_data: {
        status: 'processed',
        unzipped_path: unzippedDirPath,
        index_path: indexHtmlPath
      }
    })
    .eq('id', courseId)

  if (updateError) {
    console.error('Error updating course:', updateError)
    throw new Error(`Failed to update course: ${updateError.message}`)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { courseId } = await req.json()
    console.log('Processing SCORM package for course:', courseId)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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
    const indexHtmlPath = await processZipContent(zip, supabase, unzippedDirPath)

    if (!indexHtmlPath) {
      throw new Error('No index.html found in the SCORM package')
    }

    await updateCourseMetadata(supabase, courseId, unzippedDirPath, indexHtmlPath)

    console.log('Course updated successfully with paths:', {
      unzippedPath: unzippedDirPath,
      indexPath: indexHtmlPath
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'SCORM package processed successfully',
        courseId,
        unzippedPath: unzippedDirPath,
        indexPath: indexHtmlPath
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