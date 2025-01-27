import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePersonMutations } from "@/hooks/people/use-person-mutations";
import { toast } from "sonner";

interface CourseAssignmentFormProps {
  personId: string;
}

export function CourseAssignmentForm({ personId }: CourseAssignmentFormProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const { toggleAssignment } = usePersonMutations();

  const { data: courses, isLoading } = useQuery({
    queryKey: ["available_courses", personId],
    queryFn: async () => {
      const { data: assignments } = await supabase
        .from("course_assignments")
        .select("course_id")
        .eq("person_id", personId);

      const assignedCourseIds = assignments?.map((a) => a.course_id) || [];

      const { data: courses, error } = await supabase
        .from("courses")
        .select("id, title")
        .not("id", "in", `(${assignedCourseIds.join(",")})`);

      if (error) throw error;
      return courses;
    },
  });

  const handleAssign = async () => {
    if (!selectedCourseId) {
      toast.error("Please select a course");
      return;
    }

    await toggleAssignment.mutateAsync({
      personId,
      courseId: selectedCourseId,
    });

    setSelectedCourseId("");
  };

  if (isLoading) {
    return <div>Loading available courses...</div>;
  }

  if (!courses?.length) {
    return <div>No courses available for assignment</div>;
  }

  return (
    <div className="flex gap-4">
      <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Select a course to assign" />
        </SelectTrigger>
        <SelectContent>
          {courses.map((course) => (
            <SelectItem key={course.id} value={course.id}>
              {course.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleAssign} disabled={!selectedCourseId}>
        Assign Course
      </Button>
    </div>
  );
}