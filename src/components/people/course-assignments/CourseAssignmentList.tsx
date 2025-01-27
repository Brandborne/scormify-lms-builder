import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserMinus } from "lucide-react";
import { usePersonMutations } from "@/hooks/people/use-person-mutations";
import { format } from "date-fns";

interface CourseAssignmentListProps {
  personId: string;
}

export function CourseAssignmentList({ personId }: CourseAssignmentListProps) {
  const { toggleAssignment } = usePersonMutations();

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

  const handleRemove = async (courseId: string) => {
    await toggleAssignment.mutateAsync({
      personId,
      courseId,
    });
  };

  if (isLoading) {
    return <div>Loading assignments...</div>;
  }

  if (!assignments?.length) {
    return <div>No courses assigned</div>;
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(assignment.course_id)}
                className="h-8 w-8"
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}