import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function CourseSelectionAlert() {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Please select a course to manage people
      </AlertDescription>
    </Alert>
  );
}