import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeleteCourseButtonProps {
  id: string;
  onDelete: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function DeleteCourseButton({ id, onDelete, variant = "default" }: DeleteCourseButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

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

  return (
    <Button
      variant={variant}
      onClick={handleDelete}
      disabled={isDeleting}
      className="w-full"
    >
      <Trash2 className="h-4 w-4" />
      Delete Course
    </Button>
  );
}