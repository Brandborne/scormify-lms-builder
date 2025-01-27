import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { CourseAssignment } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CourseAssignmentListProps {
  assignments: CourseAssignment[];
  contactId: string;
  onAssignmentChange: () => void;
  onRefetch: () => void;
}

export function CourseAssignmentList({
  assignments,
  contactId,
  onAssignmentChange,
  onRefetch
}: CourseAssignmentListProps) {
  const handleRemoveCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from("course_assignments")
        .delete()
        .match({ 
          course_id: courseId,
          contact_id: contactId 
        });

      if (error) throw error;
      
      toast.success("Course removed successfully");
      onRefetch();
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

  if (!assignments || assignments.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No courses assigned yet
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {assignments.map((assignment) => (
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
              className="text-destructive hover:text-destructive"
              onClick={() => handleRemoveCourse(assignment.course_id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}