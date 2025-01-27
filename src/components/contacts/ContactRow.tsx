import { TableCell, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContactRowProps } from "./types";
import { ContactActions } from "./ContactActions";
import { ContactDetailsModal } from "./contact-details/ContactDetailsModal";
import { ContactProgress } from "./contact-details/ContactProgress";

export function ContactRow({
  contact,
  onContactDeleted
}: ContactRowProps) {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (error) throw error;
      toast.success('Contact deleted successfully');
      onContactDeleted();
      setIsDetailsModalOpen(false);
    } catch (error: any) {
      console.error('Delete contact error:', error);
      toast.error('Failed to delete contact: ' + error.message);
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium">{contact.name}</p>
          <p className="text-sm text-muted-foreground">{contact.email}</p>
        </div>
      </TableCell>
      <TableCell>
        <ContactProgress
          assignments={contact.assignments}
          onOpenDetails={() => setIsDetailsModalOpen(true)}
        />
      </TableCell>
      <TableCell className="text-right">
        <ContactActions
          contactId={contact.id}
          onEdit={() => setIsDetailsModalOpen(true)}
        />
      </TableCell>
      <ContactDetailsModal
        contact={contact}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onDelete={handleDelete}
      />
    </TableRow>
  );
}