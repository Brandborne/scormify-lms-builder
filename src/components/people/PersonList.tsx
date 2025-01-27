import { useState } from "react";
import { Table } from "@/components/ui/table";
import { ContactListProps } from "./types";
import { ContactTableHeader } from "./table/ContactTableHeader";
import { ContactTableBody } from "./table/ContactTableBody";
import { ErrorState, LoadingState } from "./table/ContactTableStates";
import { useContacts } from "@/hooks/contacts/use-contacts";
import { useCourseAssignments } from "@/hooks/contacts/use-course-assignments";

export function ContactList({ 
  courseId, 
  onToggleAssignment, 
  onContactDeleted 
}: ContactListProps) {
  const [sortField, setSortField] = useState<'name' | 'email'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { 
    data: contacts, 
    isLoading: isLoadingContacts, 
    error: contactsError 
  } = useContacts(sortField, sortDirection);

  const { 
    data: assignments, 
    isLoading: isLoadingAssignments 
  } = useCourseAssignments(courseId);

  const handleSort = (field: 'name' | 'email') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (contactsError) {
    return <ErrorState message={contactsError.message} />;
  }

  if (isLoadingContacts || isLoadingAssignments) {
    return <LoadingState />;
  }

  return (
    <div className="w-full rounded-md border">
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