import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { EditableTitle } from "./EditableTitle";
import { DeleteCourseButton } from "./DeleteCourseButton";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  onStart: () => void;
  onDelete: () => void;
}

export function CourseCard({ id, title, description, onStart, onDelete }: CourseCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <div className="flex items-center justify-between w-full">
            <EditableTitle id={id} initialTitle={title} />
            <DeleteCourseButton id={id} onDelete={onDelete} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{description}</p>
        <Button onClick={onStart} className="w-full">
          Start Course
        </Button>
      </CardContent>
    </Card>
  );
}