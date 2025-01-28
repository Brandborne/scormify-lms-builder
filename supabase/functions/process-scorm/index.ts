import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { parse as parseXML } from 'https://deno.land/x/xml@2.1.1/mod.ts'

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
    const xmlDoc = parseXML(manifestContent)

    // Extract comprehensive manifest data
    const manifestInfo = {
      title: findValue(xmlDoc, 'organization > title') || course.title,
      status: 'processed',
      metadata: {
        schema: findValue(xmlDoc, 'metadata > schema'),
        schemaVersion: findValue(xmlDoc, 'metadata > schemaversion'),
        objectives: extractObjectives(xmlDoc),
        masteryCriteria: findValue(xmlDoc, 'adlcp:masteryscore'),
        maxTimeAllowed: findValue(xmlDoc, 'adlcp:maxtimeallowed'),
        timeLimitAction: findValue(xmlDoc, 'adlcp:timelimitaction'),
        dataFromLMS: findValue(xmlDoc, 'adlcp:datafromlms'),
        completionThreshold: findValue(xmlDoc, 'adlcp:completionthreshold'),
        prerequisites: extractPrerequisites(xmlDoc),
        rights: findValue(xmlDoc, 'metadata > rights'),
        description: findValue(xmlDoc, 'metadata > description'),
        keywords: findValue(xmlDoc, 'metadata > keywords')?.split(',').map(k => k.trim()),
        authors: extractAuthors(xmlDoc),
        technicalRequirements: extractTechnicalRequirements(xmlDoc)
      },
      organizations: extractOrganizations(xmlDoc),
      resources: extractResources(xmlDoc),
      scormVersion: determineScormVersion(xmlDoc),
      prerequisites: extractPrerequisites(xmlDoc),
      sequencing: extractSequencing(xmlDoc),
      startingPage: findStartingPage(xmlDoc)
    }

    console.log('Parsed manifest info:', manifestInfo)

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

// Helper Functions

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

function extractObjectives(xmlDoc: any): any[] {
  const objectives = xmlDoc.objectives?.objective || []
  return (Array.isArray(objectives) ? objectives : [objectives])
    .filter(Boolean)
    .map(obj => ({
      id: obj['$identifier'],
      primaryObjective: obj['$primaryobjective'] === 'true',
      satisfiedByMeasure: obj['$satisfiedbymeasure'] === 'true',
      minNormalizedMeasure: obj.minnormalizedmeasure?.['$text'],
      description: obj.description?.['$text'],
      success_status: obj['$successstatus'],
      completion_status: obj['$completionstatus'],
      progress_measure: obj['$progressmeasure']
    }))
}

function extractOrganizations(xmlDoc: any): any {
  const organizations = xmlDoc.organizations || {}
  return {
    default: organizations['$default'] || '',
    items: extractOrganizationItems(organizations.organization || [])
  }
}

function extractOrganizationItems(items: any): any[] {
  if (!items) return []
  const itemArray = Array.isArray(items) ? items : [items]
  
  return itemArray.map(item => ({
    identifier: item['$identifier'] || '',
    title: item.title?.['$text'] || '',
    description: item.description?.['$text'],
    objectives: extractObjectives(item),
    prerequisites: item['$prerequisites'],
    masteryScore: item['$masteryscore'],
    maxTimeAllowed: item['$maxtimeallowed'],
    timeLimitAction: item['$timelimitaction'],
    dataFromLMS: item['$datafromlms'],
    completionThreshold: item['$completionthreshold'],
    sequencing: extractSequencing(item),
    children: extractOrganizationItems(item.item)
  }))
}

function extractResources(xmlDoc: any): any[] {
  const resources = xmlDoc.resources?.resource || []
  const resourceArray = Array.isArray(resources) ? resources : [resources]
  
  return resourceArray.map(resource => ({
    identifier: resource['$identifier'] || '',
    type: resource['$type'] || '',
    href: resource['$href'],
    scormType: resource['$scormtype'],
    base: resource['$base'],
    metadata: {
      description: findValue(resource, 'metadata > description'),
      requirements: findValue(resource, 'metadata > requirements')
    },
    dependencies: extractDependencies(resource.dependency),
    files: extractFiles(resource.file)
  }))
}

function extractFiles(files: any): string[] {
  if (!files) return []
  const fileArray = Array.isArray(files) ? files : [files]
  return fileArray.map(file => file['$href']).filter(Boolean)
}

function extractDependencies(dependencies: any): string[] {
  if (!dependencies) return []
  const depArray = Array.isArray(dependencies) ? dependencies : [dependencies]
  return depArray.map(dep => dep['$identifierref']).filter(Boolean)
}

function extractPrerequisites(xmlDoc: any): string[] {
  const prerequisites = xmlDoc.prerequisites || []
  if (Array.isArray(prerequisites)) {
    return prerequisites.map(p => p['$text']).filter(Boolean)
  }
  return prerequisites['$text'] ? [prerequisites['$text']] : []
}

function extractSequencing(xmlDoc: any): any {
  const sequencing = xmlDoc.sequencing
  if (!sequencing) return null
  
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
    rollupRules: extractRollupRules(sequencing.rollupRules),
    objectives: extractObjectives(sequencing)
  }
}

function extractRollupRules(rules: any): any[] {
  if (!rules?.rollupRule) return []
  const ruleArray = Array.isArray(rules.rollupRule) ? rules.rollupRule : [rules.rollupRule]
  
  return ruleArray.map(rule => ({
    childActivitySet: rule['$childactivityset'],
    minimumCount: rule['$minimumcount'],
    minimumPercent: rule['$minimumpercent'],
    action: rule.rollupaction?.['$action'],
    conditions: extractRollupConditions(rule.rollupConditions)
  }))
}

function extractRollupConditions(conditions: any): any[] {
  if (!conditions?.rollupCondition) return []
  const condArray = Array.isArray(conditions.rollupCondition) ? 
    conditions.rollupCondition : [conditions.rollupCondition]
  
  return condArray.map(cond => ({
    operator: cond['$operator'],
    condition: cond['$condition']
  }))
}

function extractAuthors(xmlDoc: any): any[] {
  const authors = xmlDoc.metadata?.contribute || []
  const authorArray = Array.isArray(authors) ? authors : [authors]
  
  return authorArray
    .filter(a => a.role?.['$text'] === 'author')
    .map(a => ({
      name: a.entity?.['$text'],
      date: a.date?.['$text']
    }))
}

function extractTechnicalRequirements(xmlDoc: any): any {
  const technical = xmlDoc.metadata?.technical
  if (!technical) return null
  
  return {
    type: technical.type?.['$text'],
    name: technical.name?.['$text'],
    minimumVersion: technical.minimumversion?.['$text'],
    maximumVersion: technical.maximumversion?.['$text']
  }
}

function determineScormVersion(xmlDoc: any): string {
  const schema = findValue(xmlDoc, 'metadata > schema')
  const schemaVersion = findValue(xmlDoc, 'metadata > schemaversion')
  
  if (schema?.includes('2004')) return 'SCORM 2004'
  if (schema?.includes('1.2')) return 'SCORM 1.2'
  if (schemaVersion?.includes('2004')) return 'SCORM 2004'
  if (schemaVersion?.includes('1.2')) return 'SCORM 1.2'
  
  // Default to 1.2 if version cannot be determined
  return 'SCORM 1.2'
}

function findStartingPage(xmlDoc: any): string | undefined {
  // Try to find in default organization
  const organizations = xmlDoc.organizations
  const defaultOrg = organizations?.['$default']
  if (defaultOrg) {
    const org = Array.isArray(organizations.organization) ?
      organizations.organization.find((o: any) => o['$identifier'] === defaultOrg) :
      organizations.organization
    
    if (org?.item) {
      const firstItem = Array.isArray(org.item) ? org.item[0] : org.item
      const resourceId = firstItem['$identifierref']
      if (resourceId) {
        const resource = findResourceById(xmlDoc, resourceId)
        if (resource?.['$href']) return resource['$href']
      }
    }
  }
  
  // Fallback to first resource with href
  const resources = xmlDoc.resources?.resource || []
  const resourceArray = Array.isArray(resources) ? resources : [resources]
  const firstResource = resourceArray.find(r => r['$href'] && r['$scormtype'] === 'sco')
  return firstResource?.['$href']
}

function findResourceById(xmlDoc: any, id: string): any {
  const resources = xmlDoc.resources?.resource || []
  const resourceArray = Array.isArray(resources) ? resources : [resources]
  return resourceArray.find((r: any) => r['$identifier'] === id)
}