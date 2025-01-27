import { useQueryClient } from "@tanstack/react-query";
import { PersonList } from "../people/PersonList";
import { usePersonMutations } from "@/hooks/people/use-person-mutations";
import { CourseSelectionAlert } from "../people/alerts/CourseSelectionAlert";

interface CoursePeopleManagementProps {
  courseId?: string;
}

export function CoursePeopleManagement({ courseId }: CoursePeopleManagementProps) {
  const queryClient = useQueryClient();
  const { toggleAssignment } = usePersonMutations();

  const handleToggleAssignment = async (personId: string) => {
    if (!courseId || !personId) return;
    await toggleAssignment.mutateAsync({ personId, courseId });
  };

  const handlePersonDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ['people'] });
  };

  if (!courseId) {
    return <CourseSelectionAlert />;
  }

  return (
    <div className="space-y-6">
      <PersonList 
        courseId={courseId}
        onToggleAssignment={handleToggleAssignment}
        onPersonDeleted={handlePersonDeleted}
      />
    </div>
  );
}