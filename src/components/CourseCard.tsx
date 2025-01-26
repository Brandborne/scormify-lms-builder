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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>
          <EditableTitle id={id} initialTitle={title} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{description}</p>
        <p className="text-sm text-muted-foreground mb-4">Added {formattedDate}</p>
        {stats && (
          <div className="flex gap-4 mb-4 text-sm">
            <div>
              <span className="font-medium">Assigned: </span>
              {stats.total_assigned || "0"}
            </div>
            <div>
              <span className="font-medium">Completed: </span>
              {stats.completed || "0"}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Button onClick={handleStart} className="w-full">
            Start Course
          </Button>
          <ContactsManagement />
          <DeleteCourseButton id={id} onDelete={onDelete} />
        </div>
      </CardContent>
    </Card>
  );
}