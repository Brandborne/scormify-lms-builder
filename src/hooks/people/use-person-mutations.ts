import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function usePersonMutations() {
  const queryClient = useQueryClient();

  const toggleAssignment = useMutation({
    mutationFn: async ({ 
      personId, 
      courseId 
    }: { 
      personId: string; 
      courseId: string;
    }) => {
      // First, check if the assignment exists
      const { data: existingAssignment, error: checkError } = await supabase
        .from('course_assignments')
        .select('id')
        .match({ 
          course_id: courseId, 
          person_id: personId 
        })
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingAssignment) {
        // Assignment exists, so unassign
        const { error: deleteError } = await supabase
          .from('course_assignments')
          .delete()
          .match({ 
            course_id: courseId, 
            person_id: personId 
          });

        if (deleteError) throw deleteError;
        return { type: 'unassigned' };
      } else {
        // No assignment exists, so assign
        const { error: insertError } = await supabase
          .from('course_assignments')
          .insert([{
            course_id: courseId,
            person_id: personId,
          }]);

        if (insertError) {
          if (insertError.code === '23505') {
            throw new Error('Person is already assigned to this course');
          }
          throw insertError;
        }
        return { type: 'assigned' };
      }
    },
    onSuccess: (data, variables) => {
      toast.success(
        data.type === 'assigned' 
          ? 'Person assigned to course successfully'
          : 'Person unassigned from course successfully'
      );
      queryClient.invalidateQueries({ 
        queryKey: ['course_assignments', variables.courseId] 
      });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (error: Error) => {
      console.error('Toggle assignment error:', error);
      toast.error(`Failed to toggle person assignment: ${error.message}`);
    }
  });

  const deletePerson = useMutation({
    mutationFn: async (personId: string) => {
      // First delete all course assignments for this person
      const { error: assignmentsError } = await supabase
        .from('course_assignments')
        .delete()
        .eq('person_id', personId);

      if (assignmentsError) throw assignmentsError;

      // Then delete the person
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', personId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Person deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
    onError: (error: Error) => {
      console.error('Delete person error:', error);
      toast.error('Failed to delete person: ' + error.message);
    }
  });

  return {
    toggleAssignment,
    deletePerson
  };
}