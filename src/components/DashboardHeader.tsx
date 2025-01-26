import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  onUpload?: () => void;
}

export function DashboardHeader({ title, onUpload }: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {onUpload && (
        <Button onClick={onUpload}>
          <Upload className="mr-2 h-4 w-4" />
          Upload SCORM
        </Button>
      )}
    </div>
  );
}