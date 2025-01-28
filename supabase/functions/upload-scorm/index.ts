import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import JSZip from 'https://esm.sh/jszip@3.10.1'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { courseId, fileData } = await req.json()
    console.log('Starting SCORM package upload for course:', courseId)

    if (!courseId || !fileData) {
      throw new Error('Course ID and file data are required')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Load zip content
    const zipContent = await JSZip.loadAsync(fileData, { base64: true })
    console.log('Loaded zip content')

    // Upload each file from the zip, excluding __MACOSX
    for (const [relativePath, file] of Object.entries(zipContent.files)) {
      // Skip macOS system files and directories
      if (!file.dir && !relativePath.startsWith('__MACOSX/')) {
        try {
          const content = await file.async('arraybuffer')
          const filePath = `Courses/${courseId}/course_files/${relativePath}`
          
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

    // Update course status to 'uploaded'
    const { error: updateError } = await supabaseClient
      .from('courses')
      .update({ processing_stage: 'uploaded' })
      .eq('id', courseId)

    if (updateError) {
      throw updateError
    }

    console.log('Successfully uploaded and extracted SCORM package')

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error uploading SCORM package:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})