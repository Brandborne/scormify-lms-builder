import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { PersonWithAssignments } from "../types";
import { PersonRow } from "../PersonRow";

interface PersonTableBodyProps {
  people?: PersonWithAssignments[];
  assignedPersonIds?: string[];
  onToggleAssignment?: (personId: string) => void;
  onPersonDeleted: () => void;
  onRemoveFromCourse?: (personId: string) => void;
}

export function PersonTableBody({
  people,
  assignedPersonIds = [],
  onToggleAssignment,
  onPersonDeleted,
  onRemoveFromCourse
}: PersonTableBodyProps) {
  if (!people?.length) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={6} className="text-center text-muted-foreground">
            No people found
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {people.map((person) => (
        <PersonRow
          key={person.id}
          person={person}
          isAssigned={assignedPersonIds.includes(person.id)}
          onToggleAssignment={onToggleAssignment}
          onPersonDeleted={onPersonDeleted}
          onRemoveFromCourse={onRemoveFromCourse}
        />
      ))}
    </TableBody>
  );
}