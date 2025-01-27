import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCourseAssignments(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course_assignments', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from('course_assignments')
        .select('person_id')
        .eq('course_id', courseId);
      
      if (error) throw error;
      return data.map(a => a.person_id);
    },
    enabled: Boolean(courseId)
  });
}