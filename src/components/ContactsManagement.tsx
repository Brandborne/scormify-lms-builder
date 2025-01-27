import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle } from "lucide-react";
import { ContactList } from "./contacts/ContactList";
import { useContactMutations } from "@/hooks/contacts/use-contact-mutations";

interface ContactsManagementProps {
  courseId?: string;
}

export function ContactsManagement({ courseId }: ContactsManagementProps) {
  const queryClient = useQueryClient();
  const { toggleAssignment } = useContactMutations();

  const handleToggleAssignment = async (contactId: string) => {
    if (!courseId || !contactId) {
      return;
    }

    await toggleAssignment.mutateAsync({ contactId, courseId });
  };

  const handleContactDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  if (!courseId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please select a course to manage contacts
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <ContactList 
        courseId={courseId}
        onToggleAssignment={handleToggleAssignment}
        onContactDeleted={handleContactDeleted}
      />
    </div>
  );
}