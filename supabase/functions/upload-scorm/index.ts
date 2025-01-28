import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import JSZip from 'https://esm.sh/jszip@3.10.1'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { courseId, fileData } = await req.json()
    console.log('Processing SCORM package for course:', courseId)

    if (!courseId || !fileData) {
      throw new Error('Course ID and file data are required')
    }

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

    if (courseError || !course) {
      console.error('Error fetching course:', courseError)
      throw new Error('Course not found')
    }

    // Load zip content
    const zipContent = await JSZip.loadAsync(fileData, { base64: true })
    console.log('Loaded zip content')

    // Process each file in the zip
    for (const [relativePath, file] of Object.entries(zipContent.files)) {
      // Skip directories and macOS system files
      if (file.dir || relativePath.startsWith('__MACOSX/')) {
        continue
      }

      try {
        const content = await file.async('arraybuffer')
        const filePath = `${course.course_files_path}/${relativePath}`
        
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

    // Update course status to uploaded
    const { error: updateError } = await supabaseClient
      .from('courses')
      .update({ processing_stage: 'uploaded' })
      .eq('id', courseId)

    if (updateError) {
      console.error('Error updating course status:', updateError)
      throw updateError
    }

    console.log('Successfully uploaded and extracted SCORM package')

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in upload-scorm function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})