import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format, isValid, parseISO } from "date-fns";
import { CourseActionsModal } from "./course/CourseActionsModal";
import { Settings, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  onDelete: () => void;
  stats?: {
    total_assigned?: string;
    completed?: string;
  };
}

export function CourseCard({ 
  id, 
  title, 
  description, 
  createdAt, 
  onDelete,
  stats 
}: CourseCardProps) {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate(`/courses/${id}`);
  };

  const handleProcessManifest = async () => {
    try {
      toast.info('Processing manifest...');
      
      const { error: processError } = await supabase.functions.invoke('process-scorm', {
        body: { courseId: id }
      });

      if (processError) {
        console.error('SCORM processing error:', processError);
        toast.error('Failed to process manifest');
        return;
      }

      toast.success('Manifest processed successfully');
    } catch (error: any) {
      console.error('Process manifest error:', error);
      toast.error('Failed to process manifest: ' + error.message);
    }
  };

  const formattedDate = (() => {
    try {
      const date = parseISO(createdAt);
      return isValid(date) ? format(date, "PPp") : "Invalid date";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  })();

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleProcessManifest}
              title="Process Manifest"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <CourseActionsModal
              id={id}
              initialTitle={title}
              initialDescription={description}
              onDelete={onDelete}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{description}</p>
        <p className="text-sm text-muted-foreground">Added {formattedDate}</p>
        {stats && (
          <div className="flex gap-4 text-sm">
            <div className="bg-secondary/50 px-3 py-1 rounded-full">
              <span className="font-medium">Assigned: </span>
              {stats.total_assigned || "0"}
            </div>
            <div className="bg-secondary/50 px-3 py-1 rounded-full">
              <span className="font-medium">Completed: </span>
              {stats.completed || "0"}
            </div>
          </div>
        )}
        <div className="pt-2">
          <Button onClick={handleStart} className="w-full">
            Start Course
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}