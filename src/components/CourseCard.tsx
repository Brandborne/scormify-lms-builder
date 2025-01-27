import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format, isValid } from "date-fns";
import { CourseActionsModal } from "./course/CourseActionsModal";

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

  const getFormattedDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (!isValid(date)) {
        return "Invalid date";
      }
      return format(date, "PPp");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid date";
    }
  };

  const formattedDate = getFormattedDate(createdAt);

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <CourseActionsModal
            id={id}
            initialTitle={title}
            initialDescription={description}
            onDelete={onDelete}
          />
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