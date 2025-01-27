import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserMinus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CourseAssignment } from "../types";

interface CourseAssignmentListProps {
  personId: string;
  onRemoveFromCourse?: (courseId: string) => void;
}

export function CourseAssignmentList({ 
  personId,
  onRemoveFromCourse 
}: CourseAssignmentListProps) {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["person_assignments", personId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_assignments")
        .select(`
          course_id,
          courses (
            title
          ),
          status,
          assigned_at,
          completed_at
        `)
        .eq("person_id", personId);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={4} className="text-center py-8">
          <div className="flex justify-center items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent" />
            <span className="text-muted-foreground">Loading assignments...</span>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (!assignments?.length) {
    return (
      <TableRow>
        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
          No courses assigned
        </TableCell>
      </TableRow>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Course</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Assigned</TableHead>
          <TableHead>Completed</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assignments.map((assignment) => (
          <TableRow key={assignment.course_id}>
            <TableCell>{assignment.courses.title}</TableCell>
            <TableCell className="capitalize">{assignment.status}</TableCell>
            <TableCell>
              {format(new Date(assignment.assigned_at), "MMM d, yyyy")}
            </TableCell>
            <TableCell>
              {assignment.completed_at
                ? format(new Date(assignment.completed_at), "MMM d, yyyy")
                : "-"}
            </TableCell>
            <TableCell>
              {onRemoveFromCourse && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveFromCourse(assignment.course_id)}
                  className="h-8 w-8"
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}