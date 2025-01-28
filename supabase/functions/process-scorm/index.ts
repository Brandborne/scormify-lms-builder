import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { parseManifest } from './manifestParser.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { courseId } = await req.json()
    console.log('Processing SCORM package for course:', courseId)

    if (!courseId) {
      throw new Error('Course ID is required')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch course data
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      console.error('Error fetching course:', courseError)
      throw new Error('Course not found')
    }

    // First, let's try to get the DTD file
    const { data: dtdData, error: dtdError } = await supabaseClient
      .storage
      .from('scorm_packages')
      .download(`${course.course_files_path}/XMLSchema.dtd`)

    if (dtdError) {
      console.error('Error downloading DTD:', dtdError)
      // Don't throw, continue with manifest processing
    } else {
      // Log the DTD content for examination
      const dtdContent = await dtdData.text()
      console.log('DTD Content:', dtdContent)
    }

    // List files in course directory
    const { data: files, error: listError } = await supabaseClient
      .storage
      .from('scorm_packages')
      .list(course.course_files_path)

    if (listError) {
      console.error('Error listing files:', listError)
      throw listError
    }

    // Find manifest file
    const manifestFile = files.find(file => 
      file.name.toLowerCase() === 'imsmanifest.xml'
    )

    if (!manifestFile) {
      throw new Error('No manifest file found in package')
    }

    // Download and parse manifest
    const { data: manifestData, error: downloadError } = await supabaseClient
      .storage
      .from('scorm_packages')
      .download(`${course.course_files_path}/imsmanifest.xml`)

    if (downloadError) {
      console.error('Error downloading manifest:', downloadError)
      throw downloadError
    }

    const manifestContent = await manifestData.text()
    console.log('Manifest Content:', manifestContent)
    
    const manifestInfo = await parseManifest(manifestContent)
    console.log('Parsed Manifest Info:', manifestInfo)

    // Update course with processed manifest data
    const { error: updateError } = await supabaseClient
      .from('courses')
      .update({
        manifest_data: manifestInfo,
        processing_stage: 'processed'
      })
      .eq('id', courseId)

    if (updateError) {
      console.error('Error updating course:', updateError)
      throw updateError
    }

    return new Response(
      JSON.stringify({ success: true, manifestInfo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing SCORM package:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})