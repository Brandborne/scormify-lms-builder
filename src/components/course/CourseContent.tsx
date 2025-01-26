import { ScormFrame } from "../scorm/ScormFrame";
import { ScormInitializer } from "../scorm/ScormInitializer";

interface CourseContentProps {
  courseId: string;
  title: string;
  publicUrl?: string;
}

export function CourseContent({ courseId, title, publicUrl }: CourseContentProps) {
  return (
    <div className="bg-card border rounded-lg p-6">
      {courseId && <ScormInitializer courseId={courseId} />}
      {publicUrl ? (
        <ScormFrame url={publicUrl} title={title} />
      ) : (
        <div>Loading course content...</div>
      )}
    </div>
  );
}