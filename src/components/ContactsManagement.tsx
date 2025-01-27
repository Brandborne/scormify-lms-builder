import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContactList } from "./contacts/ContactList";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle } from "lucide-react";

interface ContactsManagementProps {
  courseId?: string;
}

export function ContactsManagement({ courseId }: ContactsManagementProps) {
  const queryClient = useQueryClient();

  const handleToggleAssignment = async (contactId: string) => {
    if (!courseId) {
      toast.error('Please select a course first');
      return;
    }

    if (!contactId) {
      toast.error('Invalid contact selected');
      return;
    }

    try {
      // First, check if the assignment exists
      const { data: existingAssignment, error: checkError } = await supabase
        .from('course_assignments')
        .select('id')
        .match({ 
          course_id: courseId, 
          contact_id: contactId 
        })
        .maybeSingle();

      if (checkError) {
        console.error('Error checking assignment:', checkError);
        throw checkError;
      }

      if (existingAssignment) {
        // Assignment exists, so unassign
        const { error: deleteError } = await supabase
          .from('course_assignments')
          .delete()
          .match({ 
            course_id: courseId, 
            contact_id: contactId 
          });

        if (deleteError) {
          console.error('Error deleting assignment:', deleteError);
          throw deleteError;
        }
        
        toast.success('Contact unassigned from course successfully');
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
            toast.error('Contact is already assigned to this course');
          } else {
            console.error('Error inserting assignment:', insertError);
            throw insertError;
          }
        } else {
          toast.success('Contact assigned to course successfully');
        }
      }
      
      // Invalidate both contacts and course_assignments queries
      await queryClient.invalidateQueries({ queryKey: ['course_assignments', courseId] });
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
    } catch (error: any) {
      console.error('Toggle assignment error:', error);
      toast.error(`Failed to toggle contact assignment: ${error.message}`);
    }
  };

  const handleContactDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  if (!courseId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please select a course to manage contacts
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <ContactList 
        courseId={courseId}
        onToggleAssignment={handleToggleAssignment}
        onContactDeleted={handleContactDeleted}
      />
    </div>
  );
}