import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ReloadIcon } from "@radix-ui/react-icons";

interface CourseProcessingAlertProps {
  onRefresh: () => void;
  isProcessing: boolean;
}

export function CourseProcessingAlert({ onRefresh, isProcessing }: CourseProcessingAlertProps) {
  return (
    <Alert className="mb-6">
      <AlertTitle>Course Processing</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>This course is being processed. Please wait a moment.</span>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onRefresh}
          className="ml-4"
          disabled={isProcessing}
        >
          <ReloadIcon className={`mr-2 h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
          Check Again
        </Button>
      </AlertDescription>
    </Alert>
  );
}