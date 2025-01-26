import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { unZipFromURL } from 'https://deno.land/x/zip@v1.2.5/mod.ts'

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

    // Create a directory name without .zip extension
    const dirPath = course.package_path.replace('.zip', '')

    // Download and unzip the file
    const files = await unZipFromURL(zipUrl)
    console.log('Unzipped files:', files.length)

    // Upload each file to the storage bucket
    for (const file of files) {
      if (file.name.endsWith('/')) continue // Skip directories

      const { error: uploadError } = await supabase
        .storage
        .from('scorm_packages')
        .upload(`${dirPath}/${file.name}`, file.content, {
          contentType: 'application/octet-stream',
          upsert: true
        })

      if (uploadError) {
        console.error('Error uploading file:', file.name, uploadError)
        throw uploadError
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

    return new Response(
      JSON.stringify({ success: true, message: 'SCORM package processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing SCORM package:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})