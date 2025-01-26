import { useEffect } from "react";
import ScormAPI from "@/lib/scorm/ScormAPI";

interface ScormApiCleanupProps {
  api: ScormAPI | null;
}

export function ScormApiCleanup({ api }: ScormApiCleanupProps) {
  useEffect(() => {
    return () => {
      console.log('ScormApiCleanup: Starting cleanup');
      if (api) {
        console.log('ScormApiCleanup: Starting SCORM API termination');
        try {
          const terminateResult = api.Terminate();
          console.log('ScormApiCleanup: Termination result:', terminateResult);
          
          delete window.API;
          delete window.API_1484_11;
          
          console.log('ScormApiCleanup: SCORM API cleanup completed');
          console.log('ScormApiCleanup: Window.API after cleanup:', !!window.API);
          console.log('ScormApiCleanup: Window.API_1484_11 after cleanup:', !!window.API_1484_11);
        } catch (error) {
          console.error('ScormApiCleanup: Error during termination:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
      }
    };
  }, [api]);

  return null;
}