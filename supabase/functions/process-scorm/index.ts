import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";

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

    if (courseError) throw courseError

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
    
    try {
      // Use the JSZip library from a CDN
      const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default
      const zip = new JSZip()
      
      // Load and parse the zip file
      const zipContent = await zip.loadAsync(zipBuffer)
      console.log('ZIP file loaded successfully')
      
      // Create a directory name without .zip extension
      const dirPath = course.package_path.replace('.zip', '')

      // Process each file in the zip
      for (const [filename, file] of Object.entries(zipContent.files)) {
        if (file.dir) {
          console.log('Skipping directory:', filename)
          continue
        }

        try {
          // Get file content as ArrayBuffer
          const content = await file.async('arraybuffer')
          console.log('Processing file:', filename)

          const { error: uploadError } = await supabase
            .storage
            .from('scorm_packages')
            .upload(`${dirPath}/${filename}`, content, {
              contentType: 'application/octet-stream',
              upsert: true
            })

          if (uploadError) {
            console.error('Error uploading file:', filename, uploadError)
            throw uploadError
          }
          
          console.log('Successfully uploaded:', filename)
        } catch (fileError) {
          console.error('Error processing file:', filename, fileError)
          throw fileError
        }
      }

      // Update course status
      const { error: updateError } = await supabase
        .from('courses')
        .update({
          manifest_data: {
            ...course.manifest_data,
            status: 'processed'
          }
        })
        .eq('id', courseId)

      if (updateError) throw updateError
      console.log('Course status updated successfully')

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'SCORM package processed successfully',
          courseId 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    } catch (processingError) {
      console.error('Error processing ZIP:', processingError)
      throw processingError
    }
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