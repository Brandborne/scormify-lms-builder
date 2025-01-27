import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useState } from "react";
import { ContactListProps, ContactWithAssignments } from "./types";
import { ContactRow } from "./ContactRow";

export function ContactList({ 
  courseId, 
  onToggleAssignment, 
  onContactDeleted 
}: ContactListProps) {
  const [sortField, setSortField] = useState<'name' | 'email' | 'created_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { data: contacts, isLoading } = useQuery({
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
            .select('course_title, status, assigned_at, completed_at')
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

  const { data: assignments } = useQuery({
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
    enabled: !!courseId
  });

  const handleSort = (field: 'name' | 'email' | 'created_at') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (isLoading) {
    return <div>Loading contacts...</div>;
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Existing Contacts</h4>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('name')}
              >
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('email')}
              >
                Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Assigned Courses</TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('created_at')}
              >
                Created At {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts?.map((contact) => (
              <ContactRow
                key={contact.id}
                contact={contact}
                isAssigned={assignments?.includes(contact.id)}
                onToggleAssignment={onToggleAssignment}
                onContactDeleted={onContactDeleted}
              />
            ))}
            {!contacts?.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No contacts found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}