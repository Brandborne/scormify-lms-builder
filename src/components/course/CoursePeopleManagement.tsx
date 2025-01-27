import { CoursePersonList } from "../people/CoursePersonList";
import { CourseSelectionAlert } from "../people/alerts/CourseSelectionAlert";

interface CoursePeopleManagementProps {
  courseId?: string;
}

export function CoursePeopleManagement({ courseId }: CoursePeopleManagementProps) {
  if (!courseId) {
    return <CourseSelectionAlert />;
  }

  return (
    <CoursePersonList
      courseId={courseId}
      onPersonDeleted={() => {}}
    />
  );
}