import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table } from "@/components/ui/table";
import { useState } from "react";
import { ContactListProps, ContactWithAssignments } from "./types";
import { ContactTableHeader } from "./table/ContactTableHeader";
import { ContactTableBody } from "./table/ContactTableBody";
import { ErrorState, LoadingState } from "./table/ContactTableStates";

export function ContactList({ 
  courseId, 
  onToggleAssignment, 
  onContactDeleted 
}: ContactListProps) {
  const [sortField, setSortField] = useState<'name' | 'email'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: contacts, isLoading, error } = useQuery({
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

  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['course_assignments', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from('course_assignments')
        .select('contact_id')
        .eq('course_id', courseId);
      
      if (error) throw error;
      return data.map(a => a.contact_id);
    },
    enabled: Boolean(courseId)
  });

  const handleSort = (field: 'name' | 'email') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (error) {
    return <ErrorState message={error.message} />;
  }

  if (isLoading || isLoadingAssignments) {
    return <LoadingState />;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <ContactTableHeader
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
        <ContactTableBody
          contacts={contacts}
          assignedContactIds={assignments}
          onToggleAssignment={onToggleAssignment}
          onContactDeleted={onContactDeleted}
        />
      </Table>
    </div>
  );
}