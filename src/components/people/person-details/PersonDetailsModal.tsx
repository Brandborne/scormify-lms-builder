import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Person } from "../types";
import { CourseAssignmentForm } from "../course-assignments/CourseAssignmentForm";
import { CourseAssignmentList } from "../course-assignments/CourseAssignmentList";

interface PersonDetailsModalProps {
  person: Person;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PersonDetailsModal({
  person,
  open,
  onOpenChange,
}: PersonDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{person.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <CourseAssignmentForm personId={person.id} />
          <CourseAssignmentList personId={person.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
}