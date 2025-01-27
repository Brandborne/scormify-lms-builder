import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PersonWithAssignments } from "@/components/people/types";

export function usePeople(sortField: 'name' | 'email', sortDirection: 'asc' | 'desc') {
  return useQuery({
    queryKey: ['people', sortField, sortDirection],
    queryFn: async () => {
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });
      
      if (peopleError) throw peopleError;

      // Fetch course assignments for each person
      const peopleWithAssignments = await Promise.all(
        peopleData.map(async (person) => {
          const { data: assignments, error: assignmentsError } = await supabase
            .from('person_course_progress')
            .select('course_title, status, assigned_at, completed_at, course_id')
            .eq('person_id', person.id);
          
          if (assignmentsError) {
            console.error('Error fetching assignments:', assignmentsError);
            return person;
          }

          return {
            ...person,
            assignments: assignments || [],
          };
        })
      );
      
      return peopleWithAssignments as PersonWithAssignments[];
    }
  });
}