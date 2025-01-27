import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CourseDangerZoneProps {
  id: string;
  onDelete: () => void;
}

export function CourseDangerZone({ id, onDelete }: CourseDangerZoneProps) {
  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Course deleted successfully');
      onDelete();
    } catch (error: any) {
      toast.error('Failed to delete course: ' + error.message);
    }
  };

  return (
    <div className="rounded-lg border-2 border-destructive/50 p-4">
      <h4 className="font-medium text-destructive mb-2">Danger Zone</h4>
      <p className="text-sm text-muted-foreground mb-4">
        Once you delete a course, there is no going back. Please be certain.
      </p>
      <Button
        variant="destructive"
        onClick={handleDelete}
        className="w-full"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Course
      </Button>
    </div>
  );
}