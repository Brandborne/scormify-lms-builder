import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { ManifestData } from '../types/manifest.ts';
import { logDebug } from '../utils/index.ts';

export async function getCourse(courseId: string) {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );

  const { data: course, error } = await supabaseClient
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (error) {
    console.error('Error fetching course:', error);
    throw new Error('Course not found');
  }

  return course;
}

export async function updateCourseManifest(courseId: string, manifestInfo: ManifestData) {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );

  logDebug('Updating course manifest:', manifestInfo);

  const { error } = await supabaseClient
    .from('courses')
    .update({
      manifest_data: manifestInfo
    })
    .eq('id', courseId);

  if (error) {
    console.error('Error updating course:', error);
    throw new Error('Failed to update course with manifest data');
  }
}