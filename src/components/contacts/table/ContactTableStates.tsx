import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LoaderCircle } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading contacts..." }: LoadingStateProps) {
  return (
    <div className="flex justify-center items-center p-8">
      <LoaderCircle className="h-8 w-8 animate-spin mr-2" />
      <span className="text-muted-foreground">{message}</span>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Error loading contacts: {message}
      </AlertDescription>
    </Alert>
  );
}