import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import ScormAPI from "@/lib/scorm/ScormAPI";

interface ScormApiInitializerProps {
  courseId: string;
  onInitialized: (api: ScormAPI) => void;
}

// Keep track of initialized courses across renders
const initializedCourses = new Set<string>();

export function ScormApiInitializer({ courseId, onInitialized }: ScormApiInitializerProps) {
  const { toast } = useToast();
  const initializingRef = useRef(false);

  useEffect(() => {
    if (initializingRef.current || initializedCourses.has(courseId)) {
      console.log('ScormApiInitializer: Already initializing or initialized, skipping');
      return;
    }

    console.log('ScormApiInitializer: Starting initialization');
    initializingRef.current = true;
    
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
        
        const success = await api.Initialize();
        console.log('ScormApiInitializer: Initialize() result:', success);
        
        if (success === 'true') {
          onInitialized(api);
          initializedCourses.add(courseId);
          console.log('ScormApiInitializer: API initialized successfully');
          
          // Only show toast on first initialization
          if (!initializedCourses.has(courseId)) {
            toast({
              title: "Course Initialized",
              description: "Course tracking is now active",
            });
          }
        } else {
          console.error('ScormApiInitializer: Failed to initialize SCORM API');
          
          toast({
            title: "Initialization Failed",
            description: "Failed to initialize course tracking. Please refresh the page and try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('ScormApiInitializer: Error during initialization:', error);
        
        toast({
          title: "Initialization Error",
          description: `Failed to initialize course: ${error.message}. Please refresh the page and try again.`,
          variant: "destructive",
        });
      } finally {
        initializingRef.current = false;
      }
    };

    initApi();

    return () => {
      // Only clean up if component is unmounting and we're not just re-rendering
      if (!document.hidden) {
        console.log('ScormApiInitializer: Cleaning up initialization state');
        initializingRef.current = false;
        initializedCourses.delete(courseId);
      }
    };
  }, [courseId, onInitialized, toast]);

  return null;
}
