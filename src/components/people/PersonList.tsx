import { useState } from "react";
import { Table } from "@/components/ui/table";
import { PersonListProps } from "./types";
import { PersonTableHeader } from "./table/PersonTableHeader";
import { PersonTableBody } from "./table/PersonTableBody";
import { ErrorState, LoadingState } from "./table/PersonTableStates";
import { usePeople } from "@/hooks/people/use-people";
import { useCourseAssignments } from "@/hooks/people/use-course-assignments";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ListChecks } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function PersonList({
  courseId,
  onToggleAssignment,
  onPersonDeleted
}: PersonListProps) {
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

  const handleAssignPerson = async () => {
    if (!selectedPersonId || !courseId) return;

    try {
      const { error } = await supabase
        .from('course_assignments')
        .insert([{
          course_id: courseId,
          person_id: selectedPersonId,
        }]);

      if (error) throw error;
      
      toast.success('Person assigned to course successfully');
      setSelectedPersonId("");
      // Remove the onToggleAssignment call here since it's causing duplicate assignments
    } catch (error: any) {
      console.error('Assignment error:', error);
      toast.error('Failed to assign person to course');
    }
  };

  if (peopleError) {
    return <ErrorState message={peopleError.message} />;
  }

  if (isLoadingPeople || isLoadingAssignments) {
    return <LoadingState />;
  }

  // Filter people to only show those assigned to the course
  const assignedPeople = people?.filter(person => 
    assignments?.includes(person.id)
  );

  // Filter people not assigned to the course for the dropdown
  const unassignedPeople = people?.filter(person => 
    !assignments?.includes(person.id)
  );

  return (
    <div className="space-y-4">
      {unassignedPeople && unassignedPeople.length > 0 && (
        <div className="flex gap-2 items-center">
          <Select
            value={selectedPersonId}
            onValueChange={setSelectedPersonId}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a person to assign" />
            </SelectTrigger>
            <SelectContent>
              {unassignedPeople.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAssignPerson}>
            Assign to Course
          </Button>
        </div>
      )}
      
      <div className="w-full rounded-md border">
        <Table>
          <PersonTableHeader
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            icon={<ListChecks className="h-4 w-4" />}
          />
          <PersonTableBody
            people={assignedPeople}
            onPersonDeleted={onPersonDeleted}
          />
        </Table>
      </div>
    </div>
  );
}