import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import ScormAPI from "@/lib/scorm/ScormAPI";

interface ScormInitializerProps {
  courseId: string;
}

export function ScormInitializer({ courseId }: ScormInitializerProps) {
  const scormApiRef = useRef<ScormAPI | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (courseId && !scormApiRef.current) {
      const initScormApi = async () => {
        console.log('Initializing SCORM API for course:', courseId);
        const api = new ScormAPI(courseId, true); // Enable debug mode
        
        // Make API available to SCORM content
        (window as any).API = api; // For SCORM 1.2
        (window as any).API_1484_11 = api; // For SCORM 2004
        
        const success = await api.Initialize();
        
        if (success === 'true') {
          scormApiRef.current = api;
          console.log('SCORM API initialized successfully');
          toast({
            title: "Course Initialized",
            description: "Course tracking is now active",
          });
        } else {
          console.error('Failed to initialize SCORM API');
          toast({
            title: "Initialization Failed",
            description: "Failed to initialize course tracking",
            variant: "destructive",
          });
        }
      };

      initScormApi();
    }

    return () => {
      if (scormApiRef.current) {
        console.log('Terminating SCORM API');
        scormApiRef.current.Terminate();
        scormApiRef.current = null;
        delete (window as any).API;
        delete (window as any).API_1484_11;
      }
    };
  }, [courseId, toast]);

  return null;
}