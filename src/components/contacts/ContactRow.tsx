import { TableCell, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContactRowProps } from "./types";
import { ContactActions } from "./ContactActions";
import { ContactDetailsModal } from "./ContactDetailsModal";
import { ContactProgress } from "./contact-details/ContactProgress";
import { ContactEditor } from "./contact-details/ContactEditor";

export function ContactRow({
  contact,
  isAssigned,
  onToggleAssignment,
  onContactDeleted
}: ContactRowProps) {
  const [isEditing, setIsEditing] = useState(false);
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
    } catch (error: any) {
      console.error('Delete contact error:', error);
      toast.error('Failed to delete contact: ' + error.message);
    }
  };

  return (
    <TableRow>
      <TableCell>
        {isEditing ? (
          <ContactEditor
            contact={contact}
            onSave={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            <TableCell>{contact.name}</TableCell>
            <TableCell>{contact.email}</TableCell>
            <TableCell>{contact.phone || '-'}</TableCell>
            <TableCell>{contact.notes || '-'}</TableCell>
          </>
        )}
      </TableCell>
      <TableCell>
        <ContactProgress
          assignments={contact.assignments}
          onOpenDetails={() => setIsDetailsModalOpen(true)}
        />
      </TableCell>
      <TableCell className="text-right">
        {!isEditing && (
          <ContactActions
            contactId={contact.id}
            onDelete={handleDelete}
            onEdit={() => setIsEditing(true)}
          />
        )}
      </TableCell>
      <ContactDetailsModal
        contact={contact}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onAssignmentChange={onContactDeleted}
      />
    </TableRow>
  );
}