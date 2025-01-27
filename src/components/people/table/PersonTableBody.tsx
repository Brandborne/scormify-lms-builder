import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { PersonWithAssignments } from "../types";
import { PersonActions } from "../PersonActions";
import { ContactProgress } from "../PersonProgress";
import { useState } from "react";
import { PersonDetailsModal } from "../person-details/PersonDetailsModal";

interface PersonTableBodyProps {
  people: PersonWithAssignments[];
  assignedPersonIds?: string[];
  onToggleAssignment?: (personId: string) => void;
  onPersonDeleted: () => void;
  showCourseProgress?: boolean;
}

export function PersonTableBody({
  people,
  assignedPersonIds = [],
  onToggleAssignment,
  onPersonDeleted,
  showCourseProgress = false
}: PersonTableBodyProps) {
  const [selectedPerson, setSelectedPerson] = useState<PersonWithAssignments | null>(null);

  return (
    <TableBody>
      {people.map((person) => (
        <TableRow key={person.id}>
          <TableCell>{person.name}</TableCell>
          <TableCell>{person.email}</TableCell>
          <TableCell>
            <ContactProgress 
              assignments={person.assignments}
              onOpenDetails={() => setSelectedPerson(person)}
              showCourseProgress={showCourseProgress}
            />
          </TableCell>
          <TableCell>
            <PersonActions
              personId={person.id}
              onEdit={() => setSelectedPerson(person)}
            />
          </TableCell>
        </TableRow>
      ))}

      {selectedPerson && (
        <PersonDetailsModal
          person={selectedPerson}
          isOpen={true}
          onClose={() => setSelectedPerson(null)}
          onDelete={() => {
            onPersonDeleted();
            setSelectedPerson(null);
          }}
          onUpdate={onPersonDeleted}
        />
      )}
    </TableBody>
  );
}