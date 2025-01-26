import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ContactItemProps {
  contact: {
    id: string;
    name: string;
    email: string;
  };
  isAssigned?: boolean;
  courseId?: string;
  onDelete: () => void;
  onToggleAssignment?: (contactId: string, isAssigned: boolean) => void;
}

export function ContactItem({ 
  contact, 
  isAssigned = false, 
  courseId,
  onDelete,
  onToggleAssignment 
}: ContactItemProps) {
  const handleDeleteContact = async () => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (error) throw error;
      toast.success('Contact deleted successfully');
      onDelete();
    } catch (error: any) {
      toast.error('Failed to delete contact: ' + error.message);
    }
  };

  const handleToggle = () => {
    if (onToggleAssignment) {
      onToggleAssignment(contact.id, isAssigned);
    }
  };

  return (
    <div
      className={`flex justify-between items-center p-2 rounded-md ${
        isAssigned ? 'bg-primary/10' : 'bg-secondary'
      }`}
    >
      <div>
        <p className="font-medium">{contact.name}</p>
        <p className="text-sm text-muted-foreground">{contact.email}</p>
      </div>
      <div className="flex gap-2 items-center">
        {courseId && onToggleAssignment && (
          <Switch
            checked={isAssigned}
            onCheckedChange={handleToggle}
            aria-label={`Toggle assignment for ${contact.name}`}
          />
        )}
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={handleDeleteContact}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}