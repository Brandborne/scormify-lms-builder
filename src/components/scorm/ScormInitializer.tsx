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
        console.log('Starting SCORM API initialization for course:', courseId);
        console.log('Current window.API status:', !!window.API);
        console.log('Current window.API_1484_11 status:', !!window.API_1484_11);
        
        const api = new ScormAPI(courseId, true); // Enable debug mode
        
        // Make API available to SCORM content
        (window as any).API = api; // For SCORM 1.2
        (window as any).API_1484_11 = api; // For SCORM 2004
        
        console.log('SCORM API object created:', !!api);
        console.log('Window.API after assignment:', !!window.API);
        console.log('Window.API_1484_11 after assignment:', !!window.API_1484_11);
        
        const success = await api.Initialize();
        
        if (success === 'true') {
          scormApiRef.current = api;
          console.log('SCORM API initialized successfully');
          console.log('Current API state:', api);
          
          toast({
            title: "Course Initialized",
            description: "Course tracking is now active",
          });
        } else {
          console.error('Failed to initialize SCORM API');
          console.error('Initialization response:', success);
          
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
        console.log('Starting SCORM API termination');
        const terminateResult = scormApiRef.current.Terminate();
        console.log('SCORM API termination result:', terminateResult);
        
        scormApiRef.current = null;
        delete (window as any).API;
        delete (window as any).API_1484_11;
        
        console.log('SCORM API cleanup completed');
        console.log('Window.API after cleanup:', !!window.API);
        console.log('Window.API_1484_11 after cleanup:', !!window.API_1484_11);
      }
    };
  }, [courseId, toast]);

  return null;
}