import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Contact } from "./types";
import { CourseAssignmentForm } from "./course-assignments/CourseAssignmentForm";
import { CourseAssignmentList } from "./course-assignments/CourseAssignmentList";

interface ContactDetailsModalProps {
  contact: Contact;
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
  const { data: assignments, refetch: refetchAssignments } = useQuery({
    queryKey: ["contact_assignments", contact.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_course_progress")
        .select("*")
        .eq("contact_id", contact.id);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{contact.name}'s Course Assignments</DialogTitle>
          <DialogDescription>
            Manage course assignments for this contact
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <CourseAssignmentForm
            contactId={contact.id}
            onAssignmentChange={onAssignmentChange}
            onRefetch={refetchAssignments}
          />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Current Assignments</h4>
            <CourseAssignmentList
              assignments={assignments || []}
              contactId={contact.id}
              onAssignmentChange={onAssignmentChange}
              onRefetch={refetchAssignments}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}