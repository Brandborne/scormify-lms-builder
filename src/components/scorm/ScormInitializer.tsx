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
    console.log('ScormInitializer: Component mounted');
    console.log('ScormInitializer: Course ID:', courseId);
    
    if (courseId && !scormApiRef.current) {
      const initScormApi = async () => {
        console.log('ScormInitializer: Starting SCORM API initialization');
        console.log('ScormInitializer: Current window.API status:', !!window.API);
        console.log('ScormInitializer: Current window.API_1484_11 status:', !!window.API_1484_11);
        
        try {
          // Clean up any existing API instances
          if (window.API) {
            console.log('ScormInitializer: Cleaning up existing SCORM 1.2 API');
            delete window.API;
          }
          if (window.API_1484_11) {
            console.log('ScormInitializer: Cleaning up existing SCORM 2004 API');
            delete window.API_1484_11;
          }

          const api = new ScormAPI(courseId, true); // Enable debug mode
          console.log('ScormInitializer: SCORM API instance created');
          
          // Make API available to SCORM content
          window.API = api; // For SCORM 1.2
          window.API_1484_11 = api; // For SCORM 2004
          
          console.log('ScormInitializer: Window.API after assignment:', !!window.API);
          console.log('ScormInitializer: Window.API_1484_11 after assignment:', !!window.API_1484_11);
          
          const success = await api.Initialize();
          console.log('ScormInitializer: Initialize() result:', success);
          
          if (success === 'true') {
            scormApiRef.current = api;
            console.log('ScormInitializer: API initialized successfully');
            console.log('ScormInitializer: Current API state:', api);
            
            toast({
              title: "Course Initialized",
              description: "Course tracking is now active",
            });
          } else {
            console.error('ScormInitializer: Failed to initialize SCORM API');
            console.error('ScormInitializer: Initialization response:', success);
            
            toast({
              title: "Initialization Failed",
              description: "Failed to initialize course tracking. Please refresh the page and try again.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('ScormInitializer: Error during initialization:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          
          toast({
            title: "Initialization Error",
            description: `Failed to initialize course: ${error.message}. Please refresh the page and try again.`,
            variant: "destructive",
          });
        }
      };

      initScormApi();
    }

    return () => {
      console.log('ScormInitializer: Component unmounting');
      if (scormApiRef.current) {
        console.log('ScormInitializer: Starting SCORM API termination');
        try {
          const terminateResult = scormApiRef.current.Terminate();
          console.log('ScormInitializer: Termination result:', terminateResult);
          
          scormApiRef.current = null;
          delete window.API;
          delete window.API_1484_11;
          
          console.log('ScormInitializer: SCORM API cleanup completed');
          console.log('ScormInitializer: Window.API after cleanup:', !!window.API);
          console.log('ScormInitializer: Window.API_1484_11 after cleanup:', !!window.API_1484_11);
        } catch (error) {
          console.error('ScormInitializer: Error during termination:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
      }
    };
  }, [courseId, toast]);

  return null;
}