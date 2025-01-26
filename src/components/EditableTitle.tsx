import { useState } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditableTitleProps {
  id: string;
  initialTitle: string;
}

export function EditableTitle({ id, initialTitle }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUpdateTitle();
    } else if (e.key === 'Escape') {
      setTitle(initialTitle);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleUpdateTitle}
        onKeyDown={handleKeyDown}
        className="flex-1"
        placeholder="Enter course title"
        autoFocus
      />
    );
  }

  return (
    <span 
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:text-primary transition-colors"
    >
      {title}
    </span>
  );
}