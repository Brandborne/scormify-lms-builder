import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

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

    if (courseError || !course) {
      console.error('Error fetching course:', courseError)
      throw new Error('Course not found')
    }

    console.log('Found course:', course.title)

    // List files in the course directory
    const { data: files, error: listError } = await supabaseClient
      .storage
      .from('scorm_packages')
      .list(course.course_files_path)

    if (listError) {
      console.error('Error listing files:', listError)
      throw listError
    }

    console.log('Files in course directory:', files.map(f => f.name))

    // Find manifest file (case-insensitive)
    const manifestFile = files.find(file => 
      file.name.toLowerCase() === 'imsmanifest.xml'
    )

    if (!manifestFile) {
      console.error('No manifest file found in:', course.course_files_path)
      throw new Error('No manifest file found in package')
    }

    console.log('Found manifest file:', manifestFile.name)

    // Download manifest file
    const { data: manifestData, error: downloadError } = await supabaseClient
      .storage
      .from('scorm_packages')
      .download(`${course.course_files_path}/imsmanifest.xml`)

    if (downloadError) {
      console.error('Error downloading manifest:', downloadError)
      throw downloadError
    }

    // Parse manifest content
    const manifestContent = await manifestData.text()
    console.log('Manifest content length:', manifestContent.length)

    // Parse XML
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(manifestContent, "text/xml")

    // Extract manifest data
    const manifestInfo = {
      title: xmlDoc.querySelector('organization > title')?.textContent || course.title,
      description: xmlDoc.querySelector('description')?.textContent || null,
      version: xmlDoc.querySelector('schemaversion')?.textContent || '1.2',
      scormVersion: 
        xmlDoc.querySelector('metadata > schema')?.textContent?.includes('2004') 
          ? 'SCORM 2004' 
          : 'SCORM 1.2'
    }

    console.log('Parsed manifest info:', manifestInfo)

    // Update course with manifest data
    const { error: updateError } = await supabaseClient
      .from('courses')
      .update({
        title: manifestInfo.title,
        description: manifestInfo.description,
        manifest_data: manifestInfo,
        processing_stage: 'processed'
      })
      .eq('id', courseId)

    if (updateError) {
      console.error('Error updating course:', updateError)
      throw updateError
    }

    console.log('Successfully processed SCORM package')

    return new Response(
      JSON.stringify({ success: true, manifestInfo }),
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