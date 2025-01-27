import { TableCell, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContactRowProps } from "./types";
import { ContactActions } from "./ContactActions";
import { ContactDetailsModal } from "./contact-details/ContactDetailsModal";
import { ContactProgress } from "./contact-details/ContactProgress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CourseAssignmentForm } from "./course-assignments/CourseAssignmentForm";
import { CourseAssignmentList } from "./course-assignments/CourseAssignmentList";

export function ContactRow({
  contact,
  onContactDeleted
}: ContactRowProps) {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (error) throw error;
      toast.success('Contact deleted successfully');
      onContactDeleted();
      setIsDetailsModalOpen(false);
    } catch (error: any) {
      console.error('Delete contact error:', error);
      toast.error('Failed to delete contact: ' + error.message);
    }
  };

  const handleAssignmentChange = () => {
    onContactDeleted(); // This will trigger a refetch of the contacts list
  };

  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium">{contact.name}</p>
          <p className="text-sm text-muted-foreground">{contact.email}</p>
        </div>
      </TableCell>
      <TableCell>
        <ContactProgress
          assignments={contact.assignments}
          onOpenDetails={() => setIsAssignModalOpen(true)}
        />
      </TableCell>
      <TableCell className="text-right">
        <ContactActions
          contactId={contact.id}
          onEdit={() => setIsDetailsModalOpen(true)}
        />
      </TableCell>
      <ContactDetailsModal
        contact={contact}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onDelete={handleDelete}
        onUpdate={onContactDeleted}
      />
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Course Assignments - {contact.name}</DialogTitle>
            <DialogDescription>
              Manage course assignments for this contact
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <CourseAssignmentForm
              contactId={contact.id}
              onAssignmentChange={handleAssignmentChange}
              onRefetch={handleAssignmentChange}
              assignments={contact.assignments}
            />
            <CourseAssignmentList
              assignments={contact.assignments || []}
              contactId={contact.id}
              onAssignmentChange={handleAssignmentChange}
              onRefetch={handleAssignmentChange}
            />
          </div>
        </DialogContent>
      </Dialog>
    </TableRow>
  );
}