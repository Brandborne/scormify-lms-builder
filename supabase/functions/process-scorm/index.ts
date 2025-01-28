import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import JSZip from 'https://esm.sh/jszip@3.10.1'
import { corsHeaders } from '../_shared/cors.ts'
import { parseManifest } from './manifestParser.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { courseId } = await req.json()
    console.log('Processing SCORM package for course:', courseId)

    if (!courseId) {
      throw new Error('Course ID is required')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get course data
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (courseError) {
      throw courseError
    }

    if (!course) {
      throw new Error('Course not found')
    }

    console.log('Found course:', course.title)

    // Download the zip file
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('scorm_packages')
      .download(course.original_zip_path)

    if (downloadError) {
      throw downloadError
    }

    console.log('Downloaded zip file')

    // Process the zip content
    const zip = new JSZip()
    const zipContent = await zip.loadAsync(await fileData.arrayBuffer())
    
    // Find manifest file
    const manifestFile = Object.keys(zipContent.files).find(path => 
      path.toLowerCase().endsWith('imsmanifest.xml') && !path.startsWith('__MACOSX/')
    )

    if (!manifestFile) {
      throw new Error('No manifest file found in package')
    }

    console.log('Found manifest at:', manifestFile)
    
    // Extract and parse manifest
    const manifestContent = await zipContent.files[manifestFile].async('text')
    const manifestData = await parseManifest(manifestContent)
    
    console.log('Parsed manifest data:', manifestData)

    // Store both the original zip path and the extracted course files path
    const originalZipPath = course.original_zip_path
    const courseFilesPath = course.course_files_path

    // Extract and upload all files from the zip
    console.log('Extracting and uploading files...')
    for (const [relativePath, file] of Object.entries(zipContent.files)) {
      // Skip macOS system files and directories
      if (!file.dir && !relativePath.startsWith('__MACOSX/')) {
        try {
          const content = await file.async('arraybuffer')
          const filePath = `${courseFilesPath}/${relativePath}`
          
          console.log('Uploading file:', filePath)
          
          const { error: uploadError } = await supabaseClient
            .storage
            .from('scorm_packages')
            .upload(filePath, content, {
              contentType: 'application/octet-stream',
              upsert: true
            })

          if (uploadError) {
            console.error('Error uploading file:', filePath, uploadError)
            throw uploadError
          }
        } catch (error) {
          console.error('Error processing file:', relativePath, error)
          throw error
        }
      }
    }

    // Get the manifest directory to adjust relative paths
    const manifestDir = manifestFile.substring(0, manifestFile.lastIndexOf('/') + 1)
    console.log('Manifest directory:', manifestDir)

    // Determine index paths
    const startingPage = manifestData.startingPage || 'scormdriver/indexAPI.html'
    // Adjust the paths to be relative to the course files directory
    const indexPath = `${courseFilesPath}/${manifestDir}${startingPage}`
    const originalIndexPath = indexPath

    console.log('Paths:', {
      originalZipPath,
      courseFilesPath,
      startingPage,
      indexPath,
      originalIndexPath
    })

    // Update course with processing results
    const { error: updateError } = await supabaseClient
      .from('courses')
      .update({
        manifest_data: {
          ...manifestData,
          status: 'processed',
          index_path: indexPath,
          original_index_path: originalIndexPath,
          startingPage
        }
      })
      .eq('id', courseId)

    if (updateError) {
      throw updateError
    }

    console.log('Successfully processed SCORM package')

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing SCORM package:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})