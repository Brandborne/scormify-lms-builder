import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CourseAssignment } from "../types";

interface CourseAssignmentFormProps {
  personId: string;
  onAssignmentChange: () => void;
  onRefetch: () => void;
  assignments?: CourseAssignment[];
}

export function CourseAssignmentForm({ 
  personId, 
  onAssignmentChange,
  onRefetch,
  assignments = []
}: CourseAssignmentFormProps) {
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

  // Filter out already assigned courses
  const availableCourses = courses?.filter(course => 
    !assignments?.some(assignment => assignment.course_id === course.id)
  );

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
            person_id: personId,
          },
        ]);

      if (error) {
        if (error.code === "23505") {
          toast.error("Person is already assigned to this course");
        } else {
          throw error;
        }
      } else {
        toast.success("Course assigned successfully");
        setSelectedCourseId("");
        onRefetch();
        onAssignmentChange();
      }
    } catch (error: any) {
      console.error("Assignment error:", error);
      toast.error("Failed to assign course");
    }
  };

  return (
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
  );
}