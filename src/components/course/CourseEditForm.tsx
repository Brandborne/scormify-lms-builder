import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface CourseEditFormProps {
  id: string;
  initialTitle: string;
  initialDescription: string;
  onSuccess: () => void;
}

export function CourseEditForm({ 
  id, 
  initialTitle, 
  initialDescription,
  onSuccess 
}: CourseEditFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const queryClient = useQueryClient();

  const handleUpdateCourse = async () => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ 
          title,
          description 
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Course updated successfully');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      onSuccess();
    } catch (error: any) {
      toast.error('Failed to update course: ' + error.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter course title"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter course description"
        />
      </div>
      <Button onClick={handleUpdateCourse} className="w-full">
        Save Changes
      </Button>
    </div>
  );
}