import { useQueryClient } from "@tanstack/react-query";
import { ContactList } from "./contacts/ContactList";
import { useContactMutations } from "@/hooks/contacts/use-contact-mutations";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ContactFormModal } from "./contacts/ContactFormModal";

export function ContactsManagement() {
  const queryClient = useQueryClient();
  const { deleteContact } = useContactMutations();
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);

  const handleContactDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  const handleContactAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    setIsNewContactModalOpen(false);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setIsNewContactModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Contact
        </Button>
      </div>
      <ContactList 
        onContactDeleted={handleContactDeleted}
      />
      <ContactFormModal 
        isOpen={isNewContactModalOpen}
        onClose={() => setIsNewContactModalOpen(false)}
        onSuccess={handleContactAdded}
      />
    </div>
  );
}