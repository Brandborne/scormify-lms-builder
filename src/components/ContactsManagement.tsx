import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ContactForm } from "./contacts/ContactForm";
import { ContactList } from "./contacts/ContactList";

interface ContactsManagementProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  courseId?: string;
}

export function ContactsManagement({ variant = "default", courseId }: ContactsManagementProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleAssignment = async (contactId: string, isAssigned: boolean) => {
    if (!courseId) {
      toast.error('No course selected');
      return;
    }

    try {
      if (isAssigned) {
        // Unassign
        const { error } = await supabase
          .from('course_assignments')
          .delete()
          .match({ course_id: courseId, contact_id: contactId });

        if (error) throw error;
        toast.success('Contact unassigned from course successfully');
      } else {
        // Assign
        const { error } = await supabase
          .from('course_assignments')
          .insert([{
            course_id: courseId,
            contact_id: contactId,
          }]);

        if (error) {
          if (error.code === '23505') {
            toast.error('Contact is already assigned to this course');
          } else {
            throw error;
          }
        } else {
          toast.success('Contact assigned to course successfully');
        }
      }
    } catch (error: any) {
      toast.error(`Failed to ${isAssigned ? 'unassign' : 'assign'} contact: ${error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className="w-full">
          <Users className="h-4 w-4 mr-2" />
          Manage Contacts
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contact Management</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <ContactForm onSuccess={() => {}} />
          <ContactList 
            courseId={courseId}
            onToggleAssignment={handleToggleAssignment}
            onContactDeleted={() => {}}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}