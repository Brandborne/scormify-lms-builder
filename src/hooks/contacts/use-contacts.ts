import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContactWithAssignments } from "@/components/contacts/types";

export function useContacts(sortField: 'name' | 'email', sortDirection: 'asc' | 'desc') {
  return useQuery({
    queryKey: ['contacts', sortField, sortDirection],
    queryFn: async () => {
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });
      
      if (contactsError) throw contactsError;

      // Fetch course assignments for each contact
      const contactsWithAssignments = await Promise.all(
        contactsData.map(async (contact) => {
          const { data: assignments, error: assignmentsError } = await supabase
            .from('contact_course_progress')
            .select('course_title, status, assigned_at, completed_at, course_id')
            .eq('contact_id', contact.id);
          
          if (assignmentsError) {
            console.error('Error fetching assignments:', assignmentsError);
            return contact;
          }

          return {
            ...contact,
            assignments: assignments || [],
          };
        })
      );
      
      return contactsWithAssignments as ContactWithAssignments[];
    }
  });
}