import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { parse as parseXML } from 'https://deno.land/x/xml@2.1.1/mod.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { processZipContent } from './scormProcessor.ts'
import JSZip from 'https://esm.sh/jszip@3.10.1'

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
    
    const { indexHtmlPath, originalIndexPath, manifestData } = await processZipContent(
      zip,
      supabaseClient,
      courseId
    )

    console.log('Processed zip content:', { indexHtmlPath, originalIndexPath })

    // Update course with processing results
    const { error: updateError } = await supabaseClient
      .from('courses')
      .update({
        manifest_data: {
          ...manifestData,
          status: 'processed',
          index_path: indexHtmlPath,
          original_index_path: originalIndexPath
        }
      })
      .eq('id', courseId)

    if (updateError) {
      throw updateError
    }

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