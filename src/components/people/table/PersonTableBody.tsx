import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { PersonWithAssignments } from "../types";
import { PersonActions } from "../PersonActions";
import { ContactProgress } from "../PersonProgress";
import { useState } from "react";
import { PersonDetailsModal } from "../person-details/PersonDetailsModal";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CourseAssignmentForm } from "../course-assignments/CourseAssignmentForm";
import { CourseAssignmentList } from "../course-assignments/CourseAssignmentList";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const handleDelete = async (person: PersonWithAssignments) => {
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', person.id);

      if (error) throw error;
      toast.success('Person deleted successfully');
      onPersonDeleted();
      setSelectedPerson(null);
    } catch (error: any) {
      console.error('Delete person error:', error);
      toast.error('Failed to delete person: ' + error.message);
    }
  };

  return (
    <TableBody>
      {people.map((person) => (
        <TableRow key={person.id}>
          <TableCell>
            <div>
              <p className="font-medium">{person.name}</p>
              <p className="text-sm text-muted-foreground">{person.email}</p>
            </div>
          </TableCell>
          <TableCell>
            <ContactProgress
              assignments={person.assignments}
              onOpenDetails={() => {
                setSelectedPerson(person);
                setIsAssignModalOpen(true);
              }}
              showCourseProgress={showCourseProgress}
            />
          </TableCell>
          <TableCell className="text-right">
            <PersonActions
              personId={person.id}
              onEdit={() => {
                setSelectedPerson(person);
                setIsDetailsModalOpen(true);
              }}
            />
          </TableCell>

          {selectedPerson && isDetailsModalOpen && (
            <PersonDetailsModal
              person={selectedPerson}
              isOpen={isDetailsModalOpen}
              onClose={() => {
                setIsDetailsModalOpen(false);
                setSelectedPerson(null);
              }}
              onDelete={() => handleDelete(selectedPerson)}
              onUpdate={onPersonDeleted}
            />
          )}

          {selectedPerson && isAssignModalOpen && (
            <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Course Assignments - {selectedPerson.name}</DialogTitle>
                  <DialogDescription>
                    Manage course assignments for this person
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <CourseAssignmentForm
                    personId={selectedPerson.id}
                    onAssignmentChange={onPersonDeleted}
                    onRefetch={onPersonDeleted}
                    assignments={selectedPerson.assignments}
                  />
                  <CourseAssignmentList
                    assignments={selectedPerson.assignments || []}
                    personId={selectedPerson.id}
                    onAssignmentChange={onPersonDeleted}
                    onRefetch={onPersonDeleted}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </TableRow>
      ))}
    </TableBody>
  );
}