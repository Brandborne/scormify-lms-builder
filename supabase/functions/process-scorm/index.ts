import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import JSZip from 'https://esm.sh/jszip@3.10.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { courseId } = await req.json()
    console.log('Processing SCORM package for course:', courseId)

    // Initialize Supabase client
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

    // Get the zip file URL
    const { data: zipData } = supabase
      .storage
      .from('scorm_packages')
      .getPublicUrl(course.package_path)

    const zipUrl = zipData.publicUrl
    console.log('Downloading ZIP from:', zipUrl)

    // Download the zip file
    const response = await fetch(zipUrl)
    if (!response.ok) {
      throw new Error(`Failed to download ZIP: ${response.statusText}`)
    }

    const zipBuffer = await response.arrayBuffer()
    console.log('ZIP file downloaded, size:', zipBuffer.byteLength)

    // Load and parse the zip file
    const zip = new JSZip()
    const zipContent = await zip.loadAsync(zipBuffer)
    console.log('ZIP file loaded successfully')

    // Create a unique directory name for the unzipped content
    const unzippedDirPath = `${crypto.randomUUID()}`
    let indexHtmlPath = null

    // Process each file in the zip
    for (const [filename, file] of Object.entries(zipContent.files)) {
      if (file.dir) {
        console.log('Skipping directory:', filename)
        continue
      }

      try {
        // Get file content as ArrayBuffer
        const content = await file.async('arraybuffer')
        
        // Clean up the filename and create the upload path
        const cleanFilename = filename.split('/').pop() || filename
        const uploadPath = `${unzippedDirPath}/${cleanFilename}`

        console.log('Processing file:', cleanFilename)

        // Track the index.html location
        if (cleanFilename.toLowerCase() === 'index.html') {
          indexHtmlPath = uploadPath
          console.log('Found index.html at:', uploadPath)
        }

        // Upload the file to storage
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
      } catch (fileError) {
        console.error('Error processing file:', filename, fileError)
        throw new Error(`Failed to process file ${filename}: ${fileError.message}`)
      }
    }

    if (!indexHtmlPath) {
      throw new Error('No index.html found in the SCORM package')
    }

    // Update course with the unzipped directory path
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