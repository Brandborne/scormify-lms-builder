import { TableCell, TableRow, Table } from "@/components/ui/table";
import { PersonTableHeader } from "../people/table/PersonTableHeader";
import { PersonTableBody } from "../people/table/PersonTableBody";
import { ErrorState, LoadingState } from "../people/table/PersonTableStates";
import { usePeople } from "@/hooks/people/use-people";
import { useCourseAssignments } from "@/hooks/people/use-course-assignments";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PersonWithAssignments } from "../people/types";

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
  const [selectedPersonId, setSelectedPersonId] = useState<string>("");

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

  const handleAddPerson = () => {
    if (selectedPersonId && onToggleAssignment) {
      onToggleAssignment(selectedPersonId);
      setSelectedPersonId("");
    }
  };

  // Filter out already assigned people for the dropdown
  const unassignedPeople = people?.filter(person => 
    !assignments?.includes(person.id)
  ) || [];

  // Filter people to show only assigned ones
  const assignedPeople = people?.filter(person => 
    assignments?.includes(person.id)
  ) || [];

  if (peopleError) {
    return <ErrorState message={peopleError.message} />;
  }

  if (isLoadingPeople || isLoadingAssignments) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select
          value={selectedPersonId}
          onValueChange={setSelectedPersonId}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a person to add" />
          </SelectTrigger>
          <SelectContent>
            {unassignedPeople.map((person) => (
              <SelectItem key={person.id} value={person.id}>
                {person.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleAddPerson}>Add Person</Button>
      </div>

      <div className="w-full rounded-md border">
        <Table>
          <PersonTableHeader
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            hideActions
          />
          <PersonTableBody
            people={assignedPeople}
            assignedPersonIds={assignments}
            onToggleAssignment={onToggleAssignment}
            onPersonDeleted={onPersonDeleted}
            hideActions
            showCourseProgress
          />
        </Table>
      </div>
    </div>
  );
}