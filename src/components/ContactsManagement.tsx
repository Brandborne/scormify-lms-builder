import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContactList } from "./contacts/ContactList";
import { useQueryClient } from "@tanstack/react-query";

interface ContactsManagementProps {
  courseId?: string;
}

export function ContactsManagement({ courseId }: ContactsManagementProps) {
  const queryClient = useQueryClient();

  const handleToggleAssignment = async (contactId: string) => {
    if (!courseId) {
      toast.error('No course selected');
      return;
    }

    try {
      const { data: existingAssignment } = await supabase
        .from('course_assignments')
        .select('id')
        .match({ 
          course_id: courseId, 
          contact_id: contactId 
        })
        .maybeSingle();

      if (existingAssignment) {
        await supabase
          .from('course_assignments')
          .delete()
          .match({ 
            course_id: courseId, 
            contact_id: contactId 
          });
        
        toast.success('Contact unassigned from course');
      } else {
        const { error: insertError } = await supabase
          .from('course_assignments')
          .insert([{
            course_id: courseId,
            contact_id: contactId,
          }]);

        if (insertError) {
          if (insertError.code === '23505') {
            toast.error('Contact is already assigned to this course');
          } else {
            throw insertError;
          }
        } else {
          toast.success('Contact assigned to course');
        }
      }
      
      await queryClient.invalidateQueries({ queryKey: ['course_assignments', courseId] });
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
    } catch (error: any) {
      toast.error(`Failed to toggle contact assignment: ${error.message}`);
    }
  };

  const handleContactDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  return (
    <div className="space-y-4">
      <ContactList 
        courseId={courseId}
        onToggleAssignment={handleToggleAssignment}
        onContactDeleted={handleContactDeleted}
      />
    </div>
  );
}