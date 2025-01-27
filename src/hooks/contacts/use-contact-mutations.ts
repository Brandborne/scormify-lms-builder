import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useContactMutations() {
  const queryClient = useQueryClient();

  const toggleAssignment = useMutation({
    mutationFn: async ({ 
      contactId, 
      courseId 
    }: { 
      contactId: string; 
      courseId: string;
    }) => {
      // First, check if the assignment exists
      const { data: existingAssignment, error: checkError } = await supabase
        .from('course_assignments')
        .select('id')
        .match({ 
          course_id: courseId, 
          contact_id: contactId 
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
            contact_id: contactId 
          });

        if (deleteError) throw deleteError;
        return { type: 'unassigned' };
      } else {
        // No assignment exists, so assign
        const { error: insertError } = await supabase
          .from('course_assignments')
          .insert([{
            course_id: courseId,
            contact_id: contactId,
          }]);

        if (insertError) {
          if (insertError.code === '23505') {
            throw new Error('Contact is already assigned to this course');
          }
          throw insertError;
        }
        return { type: 'assigned' };
      }
    },
    onSuccess: (data, variables) => {
      toast.success(
        data.type === 'assigned' 
          ? 'Contact assigned to course successfully'
          : 'Contact unassigned from course successfully'
      );
      queryClient.invalidateQueries({ 
        queryKey: ['course_assignments', variables.courseId] 
      });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (error: Error) => {
      console.error('Toggle assignment error:', error);
      toast.error(`Failed to toggle contact assignment: ${error.message}`);
    }
  });

  const deleteContact = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Contact deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (error: Error) => {
      console.error('Delete contact error:', error);
      toast.error('Failed to delete contact: ' + error.message);
    }
  });

  return {
    toggleAssignment,
    deleteContact
  };
}