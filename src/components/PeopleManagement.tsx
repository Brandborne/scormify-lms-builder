import { useQueryClient } from "@tanstack/react-query";
import { ContactList } from "./contacts/ContactList";
import { useContactMutations } from "@/hooks/contacts/use-contact-mutations";

export function ContactsManagement() {
  const queryClient = useQueryClient();
  const { deleteContact } = useContactMutations();

  const handleContactDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  return (
    <div className="w-full">
      <ContactList 
        onContactDeleted={handleContactDeleted}
      />
    </div>
  );
}