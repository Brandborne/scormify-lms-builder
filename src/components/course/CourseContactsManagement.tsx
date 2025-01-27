import { useQueryClient } from "@tanstack/react-query";
import { ContactList } from "../contacts/ContactList";
import { useContactMutations } from "@/hooks/contacts/use-contact-mutations";
import { CourseSelectionAlert } from "../contacts/alerts/CourseSelectionAlert";

interface CourseContactsManagementProps {
  courseId?: string;
}

export function CourseContactsManagement({ courseId }: CourseContactsManagementProps) {
  const queryClient = useQueryClient();
  const { toggleAssignment } = useContactMutations();

  const handleToggleAssignment = async (contactId: string) => {
    if (!courseId || !contactId) return;
    await toggleAssignment.mutateAsync({ contactId, courseId });
  };

  const handleContactDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  if (!courseId) {
    return <CourseSelectionAlert />;
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