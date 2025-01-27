import { TableCell, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PersonActions } from "./PersonActions";
import { PersonDetailsModal } from "./PersonDetailsModal";
import { ContactProgress } from "./PersonProgress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CourseAssignmentForm } from "./course-assignments/CourseAssignmentForm";
import { CourseAssignmentList } from "./course-assignments/CourseAssignmentList";
import { PersonRowProps } from "./types";

export function PersonRow({
  person,
  onPersonDeleted
}: PersonRowProps) {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', person.id);

      if (error) throw error;
      toast.success('Person deleted successfully');
      onPersonDeleted();
      setIsDetailsModalOpen(false);
    } catch (error: any) {
      console.error('Delete person error:', error);
      toast.error('Failed to delete person: ' + error.message);
    }
  };

  const handleAssignmentChange = () => {
    onPersonDeleted(); // This will trigger a refetch of the people list
  };

  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium">{person.name}</p>
          <p className="text-sm text-muted-foreground">{person.email}</p>
        </div>
      </TableCell>
      <TableCell>
        <ContactProgress
          assignments={person.assignments}
          onOpenDetails={() => setIsAssignModalOpen(true)}
        />
      </TableCell>
      <TableCell className="text-right">
        <PersonActions
          personId={person.id}
          onEdit={() => setIsDetailsModalOpen(true)}
        />
      </TableCell>

      <PersonDetailsModal
        person={person}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onDelete={handleDelete}
        onUpdate={onPersonDeleted}
      />

      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Course Assignments - {person.name}</DialogTitle>
            <DialogDescription>
              Manage course assignments for this person
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <CourseAssignmentForm
              personId={person.id}
              onAssignmentChange={handleAssignmentChange}
              onRefetch={handleAssignmentChange}
              assignments={person.assignments}
            />
            <CourseAssignmentList
              assignments={person.assignments || []}
              personId={person.id}
              onAssignmentChange={handleAssignmentChange}
              onRefetch={handleAssignmentChange}
            />
          </div>
        </DialogContent>
      </Dialog>
    </TableRow>
  );
}