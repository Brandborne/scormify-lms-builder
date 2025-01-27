import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CourseAssignmentForm } from "./course-assignments/CourseAssignmentForm";
import { CourseAssignmentList } from "./course-assignments/CourseAssignmentList";
import { ContactWithAssignments } from "./types";

interface ContactDetailsModalProps {
  contact: ContactWithAssignments;
  isOpen: boolean;
  onClose: () => void;
  onAssignmentChange: () => void;
}

export function ContactDetailsModal({
  contact,
  isOpen,
  onClose,
  onAssignmentChange,
}: ContactDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            onAssignmentChange={onAssignmentChange}
            onRefetch={onAssignmentChange}
            assignments={contact.assignments}
          />
          <CourseAssignmentList
            assignments={contact.assignments || []}
            contactId={contact.id}
            onAssignmentChange={onAssignmentChange}
            onRefetch={onAssignmentChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}