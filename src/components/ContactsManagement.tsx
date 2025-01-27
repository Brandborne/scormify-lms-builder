import { useQueryClient } from "@tanstack/react-query";
import { ContactList } from "./contacts/ContactList";
import { useContactMutations } from "@/hooks/contacts/use-contact-mutations";
import { ContactForm } from "./contacts/ContactForm";

export function ContactsManagement() {
  const queryClient = useQueryClient();
  const { deleteContact } = useContactMutations();

  const handleContactDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  const handleContactAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  return (
    <div className="space-y-6">
      <ContactForm onSuccess={handleContactAdded} />
      <ContactList 
        onContactDeleted={handleContactDeleted}
      />
    </div>
  );
}