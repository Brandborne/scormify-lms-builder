import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  onStart: () => void;
  onDelete: () => void;
}

export function CourseCard({ id, title: initialTitle, description, onStart, onDelete }: CourseCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateTitle = async () => {
    try {
      if (title === initialTitle) {
        setIsEditing(false);
        return;
      }

      const { error } = await supabase
        .from('courses')
        .update({ title })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Course title updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      toast.error('Failed to update course title: ' + error.message);
      setTitle(initialTitle);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Course deleted successfully');
      onDelete();
    } catch (error: any) {
      toast.error('Failed to delete course: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUpdateTitle();
    } else if (e.key === 'Escape') {
      setTitle(initialTitle);
      setIsEditing(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {isEditing ? (
            <div className="flex items-center gap-2 w-full">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleUpdateTitle}
                onKeyDown={handleKeyDown}
                className="flex-1"
                placeholder="Enter course title"
                autoFocus
              />
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span 
                onClick={() => setIsEditing(true)}
                className="cursor-pointer hover:text-primary transition-colors"
              >
                {title}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
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