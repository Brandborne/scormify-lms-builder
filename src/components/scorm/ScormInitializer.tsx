import { useEffect, useRef } from "react";
import ScormAPI from "@/lib/scorm/ScormAPI";
import { toast } from "sonner";

interface ScormInitializerProps {
  courseId: string;
}

export function ScormInitializer({ courseId }: ScormInitializerProps) {
  const scormApiRef = useRef<ScormAPI | null>(null);

  useEffect(() => {
    if (courseId && !scormApiRef.current) {
      const initScormApi = async () => {
        console.log('Initializing SCORM API for course:', courseId);
        const api = new ScormAPI(courseId, true); // Enable debug mode
        
        // Make API available to SCORM content
        (window as any).API_1484_11 = api;
        
        const success = await api.Initialize();
        
        if (success === 'true') {
          scormApiRef.current = api;
          console.log('SCORM API initialized successfully');
          toast.success('Course initialized successfully');
        } else {
          console.error('Failed to initialize SCORM API');
          toast.error('Failed to initialize course tracking');
        }
      };

      initScormApi();
    }

    return () => {
      if (scormApiRef.current) {
        console.log('Terminating SCORM API');
        scormApiRef.current.Terminate();
        scormApiRef.current = null;
        delete (window as any).API_1484_11;
      }
    };
  }, [courseId]);

  return null;
}