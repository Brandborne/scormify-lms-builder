import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import ScormAPI from "@/lib/scorm/ScormAPI";

interface ScormApiInitializerProps {
  courseId: string;
  onInitialized: (api: ScormAPI) => void;
}

export function ScormApiInitializer({ courseId, onInitialized }: ScormApiInitializerProps) {
  const { toast } = useToast();

  useEffect(() => {
    console.log('ScormApiInitializer: Starting initialization');
    
    // Clean up any existing API instances
    if (window.API) {
      console.log('ScormApiInitializer: Cleaning up existing SCORM 1.2 API');
      delete window.API;
    }
    if (window.API_1484_11) {
      console.log('ScormApiInitializer: Cleaning up existing SCORM 2004 API');
      delete window.API_1484_11;
    }

    const initApi = async () => {
      try {
        const api = new ScormAPI(courseId, true);
        console.log('ScormApiInitializer: SCORM API instance created');
        
        // Make API available to SCORM content
        window.API = api;
        window.API_1484_11 = api;
        
        console.log('ScormApiInitializer: Window.API after assignment:', !!window.API);
        console.log('ScormApiInitializer: Window.API_1484_11 after assignment:', !!window.API_1484_11);
        
        const success = await api.Initialize();
        console.log('ScormApiInitializer: Initialize() result:', success);
        
        if (success === 'true') {
          onInitialized(api);
          console.log('ScormApiInitializer: API initialized successfully');
          
          toast({
            title: "Course Initialized",
            description: "Course tracking is now active",
          });
        } else {
          console.error('ScormApiInitializer: Failed to initialize SCORM API');
          console.error('ScormApiInitializer: Initialization response:', success);
          
          toast({
            title: "Initialization Failed",
            description: "Failed to initialize course tracking. Please refresh the page and try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('ScormApiInitializer: Error during initialization:', {
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

    initApi();
  }, [courseId, onInitialized, toast]);

  return null;
}