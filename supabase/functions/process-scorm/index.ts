import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import JSZip from 'https://esm.sh/jszip@3.10.1'
import { downloadZipFile } from './fileUtils.ts'
import { processZipContent } from './scormProcessor.ts'

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
    const body = await req.json().catch(() => null)
    if (!body || !body.courseId) {
      throw new Error('Invalid request: courseId is required')
    }

    const { courseId } = body
    console.log('Processing SCORM package for course:', courseId)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // First update the status to processing to prevent multiple processing attempts
    const { error: updateError } = await supabase
      .from('courses')
      .update({
        manifest_data: {
          status: 'processing'
        }
      })
      .eq('id', courseId)

    if (updateError) {
      console.error('Error updating course status:', updateError)
      throw new Error(`Failed to update course status: ${updateError.message}`)
    }

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

    const zipBuffer = await downloadZipFile(supabase, course.package_path)
    console.log('ZIP file downloaded, size:', zipBuffer.byteLength)

    const zip = new JSZip()
    const zipContent = await zip.loadAsync(zipBuffer)
    console.log('ZIP file loaded successfully')

    const { indexHtmlPath, originalIndexPath } = await processZipContent(
      zip, 
      supabase,
      courseId
    )

    console.log('SCORM package unzipped successfully')

    // Update the manifest data with the processed status and paths
    const { error: finalUpdateError } = await supabase
      .from('courses')
      .update({
        manifest_data: {
          ...course.manifest_data,
          status: 'processed',
          indexHtmlPath,
          originalIndexPath
        }
      })
      .eq('id', courseId)

    if (finalUpdateError) {
      console.error('Error updating final course status:', finalUpdateError)
      throw new Error(`Failed to update final course status: ${finalUpdateError.message}`)
    }

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