import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditableTitle } from "./EditableTitle";
import { DeleteCourseButton } from "./DeleteCourseButton";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ContactsManagement } from "./ContactsManagement";

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

  const formattedDate = format(new Date(createdAt), "PPp");

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-2">
        <CardTitle>
          <EditableTitle id={id} initialTitle={title} />
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
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={handleStart} className="w-full">
            Start Course
          </Button>
          <ContactsManagement variant="secondary" courseId={id} />
          <DeleteCourseButton id={id} onDelete={onDelete} variant="ghost" />
        </div>
      </CardContent>
    </Card>
  );
}