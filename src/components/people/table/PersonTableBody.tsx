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
  hideActions?: boolean;
  showCourseProgress?: boolean;
}

export function PersonTableBody({
  people,
  assignedPersonIds = [],
  onToggleAssignment,
  onPersonDeleted,
  hideActions = false,
  showCourseProgress = false
}: PersonTableBodyProps) {
  const [selectedPerson, setSelectedPerson] = useState<PersonWithAssignments | null>(null);

  return (
    <>
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
            {!hideActions && (
              <TableCell className="text-right">
                <PersonActions
                  personId={person.id}
                  onEdit={() => setSelectedPerson(person)}
                />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>

      {selectedPerson && (
        <PersonDetailsModal
          person={selectedPerson}
          isOpen={!!selectedPerson}
          onClose={() => setSelectedPerson(null)}
          onDelete={onPersonDeleted}
          onUpdate={() => {
            setSelectedPerson(null);
            onPersonDeleted();
          }}
        />
      )}
    </>
  );
}