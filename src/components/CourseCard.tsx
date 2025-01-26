import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditableTitle } from "./EditableTitle";
import { DeleteCourseButton } from "./DeleteCourseButton";
import { useNavigate } from "react-router-dom";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  onStart: () => void;
  onDelete: () => void;
}

export function CourseCard({ id, title, description, onDelete }: CourseCardProps) {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate(`/courses/${id}`);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>
          <EditableTitle id={id} initialTitle={title} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="space-y-2">
          <Button onClick={handleStart} className="w-full">
            Start Course
          </Button>
          <DeleteCourseButton id={id} onDelete={onDelete} />
        </div>
      </CardContent>
    </Card>
  );
}