import { TableCell, TableRow, Table } from "@/components/ui/table";
import { PersonTableHeader } from "../people/table/PersonTableHeader";
import { PersonTableBody } from "../people/table/PersonTableBody";
import { ErrorState, LoadingState } from "../people/table/PersonTableStates";
import { usePeople } from "@/hooks/people/use-people";
import { useCourseAssignments } from "@/hooks/people/use-course-assignments";
import { useState } from "react";

interface CoursePeopleListProps {
  courseId: string;
  onToggleAssignment?: (personId: string) => void;
  onPersonDeleted: () => void;
}

export function CoursePeopleList({
  courseId,
  onToggleAssignment,
  onPersonDeleted
}: CoursePeopleListProps) {
  const [sortField, setSortField] = useState<'name' | 'email'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const {
    data: people,
    isLoading: isLoadingPeople,
    error: peopleError
  } = usePeople(sortField, sortDirection);

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

  if (peopleError) {
    return <ErrorState message={peopleError.message} />;
  }

  if (isLoadingPeople || isLoadingAssignments) {
    return <LoadingState />;
  }

  return (
    <div className="w-full rounded-md border">
      <Table>
        <PersonTableHeader
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
        <PersonTableBody
          people={people}
          assignedPersonIds={assignments}
          onToggleAssignment={onToggleAssignment}
          onPersonDeleted={onPersonDeleted}
        />
      </Table>
    </div>
  );
}