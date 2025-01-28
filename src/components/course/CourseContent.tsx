import { ScormFrame } from "../scorm/ScormFrame";
import { ScormInitializer } from "../scorm/ScormInitializer";
import { CourseManifestData } from "@/types/course";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface CourseContentProps {
  courseId: string;
  title: string;
  courseUrl?: {
    url: string;
    scormVersion: string;
  };
  manifestData?: CourseManifestData;
}

export function CourseContent({ 
  courseId, 
  title, 
  courseUrl,
  manifestData 
}: CourseContentProps) {
  return (
    <div className="space-y-4">
      {manifestData?.prerequisites && manifestData.prerequisites.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Prerequisites: {manifestData.prerequisites.join(', ')}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="bg-card border rounded-lg p-6">
        {courseId && (
          <ScormInitializer 
            courseId={courseId} 
            scormVersion={manifestData?.scormVersion}
          />
        )}
        
        {courseUrl ? (
          <ScormFrame 
            url={courseUrl.url} 
            title={title}
            scormVersion={courseUrl.scormVersion} 
          />
        ) : (
          <div>Loading course content...</div>
        )}
      </div>
    </div>
  );
}