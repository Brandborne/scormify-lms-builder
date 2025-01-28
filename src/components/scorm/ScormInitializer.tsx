import { useRef } from "react";
import ScormAPI from "@/lib/scorm/ScormAPI";
import { ScormApiInitializer } from "./initialization/ScormApiInitializer";
import { ScormApiCleanup } from "./cleanup/ScormApiCleanup";

interface ScormInitializerProps {
  courseId: string;
  scormVersion?: string;
}

export function ScormInitializer({ courseId, scormVersion }: ScormInitializerProps) {
  const scormApiRef = useRef<ScormAPI | null>(null);

  const handleInitialized = (api: ScormAPI) => {
    scormApiRef.current = api;
  };

  return (
    <>
      <ScormApiInitializer 
        courseId={courseId} 
        scormVersion={scormVersion}
        onInitialized={handleInitialized} 
      />
      <ScormApiCleanup api={scormApiRef.current} />
    </>
  );
}