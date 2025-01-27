import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Contact, CourseAssignment } from "./types";
import { format } from "date-fns";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { X } from "lucide-react";

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
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title");
      if (error) throw error;
      return data;
    },
  });

  const { data: assignments, refetch: refetchAssignments } = useQuery({
    queryKey: ["contact_assignments", contact.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_course_progress")
        .select("*")
        .eq("contact_id", contact.id);
      if (error) throw error;
      return data as CourseAssignment[];
    },
  });

  const handleAssignCourse = async () => {
    if (!selectedCourseId) {
      toast.error("Please select a course");
      return;
    }

    try {
      const { error } = await supabase
        .from("course_assignments")
        .insert([
          {
            course_id: selectedCourseId,
            contact_id: contact.id,
          },
        ]);

      if (error) {
        if (error.code === "23505") {
          toast.error("Contact is already assigned to this course");
        } else {
          throw error;
        }
      } else {
        toast.success("Course assigned successfully");
        setSelectedCourseId("");
        refetchAssignments();
        onAssignmentChange();
      }
    } catch (error: any) {
      console.error("Assignment error:", error);
      toast.error("Failed to assign course");
    }
  };

  const handleRemoveCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from("course_assignments")
        .delete()
        .eq("contact_id", contact.id)
        .eq("course_id", courseId);

      if (error) throw error;
      
      toast.success("Course removed successfully");
      refetchAssignments();
      onAssignmentChange();
    } catch (error: any) {
      console.error("Remove course error:", error);
      toast.error("Failed to remove course");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  // Filter out already assigned courses
  const availableCourses = courses?.filter(
    course => !assignments?.some(
      assignment => assignment.course_id === course.id
    )
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{contact.name}'s Course Assignments</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Assign New Course</h4>
            <div className="flex gap-2">
              <Select
                value={selectedCourseId}
                onValueChange={setSelectedCourseId}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {availableCourses?.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAssignCourse}>Assign</Button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Current Assignments</h4>
            <div className="space-y-2">
              {assignments?.map((assignment) => (
                <div
                  key={assignment.course_id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div>
                    <p className="font-medium">{assignment.course_title}</p>
                    <p className="text-sm text-muted-foreground">
                      Assigned: {format(new Date(assignment.assigned_at), "PPp")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${getStatusColor(
                        assignment.status
                      )} text-white capitalize`}
                    >
                      {assignment.status?.replace("_", " ")}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCourse(assignment.course_id)}
                      className="text-destructive hover:text-destructive/90"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!assignments || assignments.length === 0) && (
                <p className="text-muted-foreground text-sm">
                  No courses assigned yet
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}