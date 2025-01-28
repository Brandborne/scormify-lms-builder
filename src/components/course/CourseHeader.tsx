import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface CourseHeaderProps {
  title: string;
  description?: string | null;
  scormVersion?: string;
}

export function CourseHeader({ title, description, scormVersion }: CourseHeaderProps) {
  const navigate = useNavigate();
  
  return (
    <div className="mb-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Courses
      </Button>
      
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        {scormVersion && (
          <Badge variant="secondary">
            {scormVersion}
          </Badge>
        )}
      </div>
      
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
    </div>
  );
}