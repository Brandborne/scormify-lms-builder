import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
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

    // Update course status to processing
    await supabaseClient
      .from('courses')
      .update({ processing_stage: 'processing' })
      .eq('id', courseId)

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

    // Find manifest file in the course files
    const { data: files, error: listError } = await supabaseClient
      .storage
      .from('scorm_packages')
      .list(`Courses/${courseId}/course_files`)

    if (listError) {
      throw listError
    }

    const manifestFile = files.find(f => 
      f.name.toLowerCase() === 'imsmanifest.xml'
    )

    if (!manifestFile) {
      throw new Error('No manifest file found in package')
    }

    console.log('Found manifest file:', manifestFile.name)

    // Download and parse manifest
    const { data: manifestData, error: downloadError } = await supabaseClient
      .storage
      .from('scorm_packages')
      .download(`Courses/${courseId}/course_files/imsmanifest.xml`)

    if (downloadError) {
      throw downloadError
    }

    const manifestContent = await manifestData.text()
    const manifest = await parseManifest(manifestContent)
    
    console.log('Parsed manifest data:', manifest)

    // Update course with manifest data and mark as processed
    const { error: updateError } = await supabaseClient
      .from('courses')
      .update({
        manifest_data: {
          ...manifest,
          status: 'processed',
          index_path: `Courses/${courseId}/course_files/${manifest.startingPage || 'index.html'}`,
          original_index_path: `Courses/${courseId}/course_files/${manifest.startingPage || 'index.html'}`
        },
        processing_stage: 'processed'
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