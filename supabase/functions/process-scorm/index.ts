import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { parse as parseXML } from 'https://deno.land/x/xml@2.1.1/mod.ts'

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

    const { data: files, error: listError } = await supabaseClient
      .storage
      .from('scorm_packages')
      .list(course.course_files_path)

    if (listError) {
      console.error('Error listing files:', listError)
      throw listError
    }

    console.log('Files in course directory:', files.map(f => f.name))

    const manifestFile = files.find(file => 
      file.name.toLowerCase() === 'imsmanifest.xml'
    )

    if (!manifestFile) {
      console.error('No manifest file found in:', course.course_files_path)
      throw new Error('No manifest file found in package')
    }

    console.log('Found manifest file:', manifestFile.name)

    const { data: manifestData, error: downloadError } = await supabaseClient
      .storage
      .from('scorm_packages')
      .download(`${course.course_files_path}/imsmanifest.xml`)

    if (downloadError) {
      console.error('Error downloading manifest:', downloadError)
      throw downloadError
    }

    const manifestContent = await manifestData.text()
    console.log('Manifest content length:', manifestContent.length)

    const xmlDoc = parseXML(manifestContent)
    console.log('Successfully parsed XML')

    // Extract manifest data with enhanced information
    const manifestInfo = {
      title: findValue(xmlDoc, 'organization > title') || course.title,
      description: findValue(xmlDoc, 'description'),
      version: findValue(xmlDoc, 'schemaversion'),
      status: 'processed',
      scormVersion: findValue(xmlDoc, 'metadata > schema')?.includes('2004') 
        ? 'SCORM 2004' 
        : 'SCORM 1.2',
      startingPage: findStartingPage(xmlDoc),
      organizations: extractOrganizations(xmlDoc),
      resources: extractResources(xmlDoc),
      prerequisites: extractPrerequisites(xmlDoc),
      metadata: {
        schema: findValue(xmlDoc, 'metadata > schema'),
        schemaVersion: findValue(xmlDoc, 'metadata > schemaversion'),
        location: findValue(xmlDoc, 'metadata > location'),
        rights: findValue(xmlDoc, 'metadata > rights'),
        minimumSCORMVersion: findValue(xmlDoc, 'metadata > minimumSCORMVersion'),
        masteryCriteria: findValue(xmlDoc, 'adlcp:masteryscore'),
        maxTimeAllowed: findValue(xmlDoc, 'adlcp:maxtimeallowed'),
        timeLimitAction: findValue(xmlDoc, 'adlcp:timelimitaction'),
        dataFromLMS: findValue(xmlDoc, 'adlcp:datafromlms'),
        completionThreshold: findValue(xmlDoc, 'adlcp:completionthreshold'),
        objectives: extractObjectives(xmlDoc),
        sequencing: extractSequencing(xmlDoc)
      }
    }

    console.log('Parsed manifest info:', manifestInfo)

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

// Helper function to find XML node values
function findValue(xmlDoc: any, path: string): string | undefined {
  const parts = path.split('>')
  let current = xmlDoc
  
  for (const part of parts) {
    const trimmed = part.trim()
    if (!current[trimmed]) return undefined
    current = current[trimmed]
  }
  
  return current?.['$text'] || undefined
}

// Helper function to extract organizations structure
function extractOrganizations(xmlDoc: any): any {
  const organizations = xmlDoc.organizations
  if (!organizations) return undefined

  const result = {
    default: organizations['$default'] || '',
    items: []
  }

  const orgs = organizations.organization
  if (Array.isArray(orgs)) {
    result.items = orgs.map(org => ({
      identifier: org['$identifier'] || '',
      title: org.title?.['$text'] || '',
      items: extractItems(org.item)
    }))
  } else if (orgs) {
    result.items = [{
      identifier: orgs['$identifier'] || '',
      title: orgs.title?.['$text'] || '',
      items: extractItems(orgs.item)
    }]
  }

  return result
}

// Helper function to extract items recursively
function extractItems(items: any): any[] {
  if (!items) return []
  
  const itemArray = Array.isArray(items) ? items : [items]
  return itemArray.map(item => ({
    identifier: item['$identifier'] || '',
    title: item.title?.['$text'] || '',
    launch: item['$identifierref'],
    prerequisites: item['$prerequisites'],
    masteryScore: item['$masteryscore'],
    maxTimeAllowed: item['$maxtimeallowed'],
    timeLimitAction: item['$timelimitaction'],
    dataFromLMS: item['$datafromlms'],
    completionThreshold: item['$completionthreshold'],
    items: extractItems(item.item)
  }))
}

// Helper function to extract resources
function extractResources(xmlDoc: any): any[] {
  const resources = xmlDoc.resources?.resource
  if (!resources) return []

  const resourceArray = Array.isArray(resources) ? resources : [resources]
  return resourceArray.map(resource => ({
    identifier: resource['$identifier'] || '',
    type: resource['$type'] || '',
    href: resource['$href'],
    scormType: resource['$scormtype'],
    dependencies: extractDependencies(resource.dependency),
    files: extractFiles(resource.file)
  }))
}

// Helper function to extract files
function extractFiles(files: any): string[] {
  if (!files) return []
  
  const fileArray = Array.isArray(files) ? files : [files]
  return fileArray.map(file => file['$href']).filter(Boolean)
}

// Helper function to extract dependencies
function extractDependencies(dependencies: any): string[] {
  if (!dependencies) return []
  
  const depArray = Array.isArray(dependencies) ? dependencies : [dependencies]
  return depArray.map(dep => dep['$identifierref']).filter(Boolean)
}

// Helper function to extract prerequisites
function extractPrerequisites(xmlDoc: any): string[] {
  const prerequisites = xmlDoc.prerequisites
  if (!prerequisites) return []
  
  if (Array.isArray(prerequisites)) {
    return prerequisites.map(p => p['$text']).filter(Boolean)
  }
  
  return prerequisites['$text'] ? [prerequisites['$text']] : []
}

// Helper function to extract objectives
function extractObjectives(xmlDoc: any): any[] {
  const objectives = xmlDoc.objectives?.objective
  if (!objectives) return []

  const objArray = Array.isArray(objectives) ? objectives : [objectives]
  return objArray.map(obj => ({
    id: obj['$identifier'],
    primaryObjective: obj['$primaryobjective'] === 'true',
    satisfiedByMeasure: obj['$satisfiedbymeasure'] === 'true',
    minNormalizedMeasure: obj.minnormalizedmeasure?.['$text'],
    description: obj.description?.['$text']
  }))
}

// Helper function to extract sequencing information
function extractSequencing(xmlDoc: any): any {
  const sequencing = xmlDoc.sequencing
  if (!sequencing) return undefined

  return {
    controlMode: {
      choice: sequencing.controlmode?.['$choice'] === 'true',
      choiceExit: sequencing.controlmode?.['$choiceexit'] === 'true',
      flow: sequencing.controlmode?.['$flow'] === 'true',
      forwardOnly: sequencing.controlmode?.['$forwardonly'] === 'true'
    },
    limitConditions: {
      attemptLimit: sequencing.limitconditions?.['$attemptlimit'],
      attemptAbsoluteDurationLimit: sequencing.limitconditions?.['$attemptabsolutedurationlimit']
    },
    rollupRules: extractRollupRules(sequencing.rollupRules)
  }
}

// Helper function to extract rollup rules
function extractRollupRules(rules: any): any[] {
  if (!rules) return []

  const ruleArray = Array.isArray(rules.rollupRule) ? rules.rollupRule : [rules.rollupRule]
  return ruleArray.map(rule => ({
    childActivitySet: rule['$childactivityset'],
    minimumCount: rule['$minimumcount'],
    minimumPercent: rule['$minimumpercent'],
    action: rule.rollupaction?.['$action']
  }))
}

// Helper function to find the starting page
function findStartingPage(xmlDoc: any): string | undefined {
  // Try to find it in resources
  const resources = xmlDoc.resources?.resource
  if (Array.isArray(resources)) {
    const resource = resources.find((r: any) => r['$href'] && r['$scormtype'] === 'sco')
    if (resource) return resource['$href']
  } else if (resources?.['$href'] && resources?.['$scormtype'] === 'sco') {
    return resources['$href']
  }

  // If not found in resources, try organizations
  const organizations = xmlDoc.organizations?.organization
  if (Array.isArray(organizations)) {
    for (const org of organizations) {
      if (org.item?.['$identifierref']) {
        const resourceId = org.item['$identifierref']
        const resource = findResourceById(xmlDoc, resourceId)
        if (resource?.['$href']) return resource['$href']
      }
    }
  }

  return undefined
}

// Helper function to find a resource by ID
function findResourceById(xmlDoc: any, id: string): any {
  const resources = xmlDoc.resources?.resource
  if (Array.isArray(resources)) {
    return resources.find((r: any) => r['$identifier'] === id)
  }
  return resources?.['$identifier'] === id ? resources : undefined
}