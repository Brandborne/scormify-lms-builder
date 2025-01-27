import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ContactWithAssignments } from "../types";
import { ContactRow } from "../ContactRow";

interface ContactTableBodyProps {
  contacts?: ContactWithAssignments[];
  assignedContactIds?: string[];
  onToggleAssignment?: (contactId: string) => void;
  onContactDeleted: () => void;
}

export function ContactTableBody({
  contacts,
  assignedContactIds = [],
  onToggleAssignment,
  onContactDeleted
}: ContactTableBodyProps) {
  if (!contacts?.length) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={6} className="text-center text-muted-foreground">
            No contacts found
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {contacts.map((contact) => (
        <ContactRow
          key={contact.id}
          contact={contact}
          isAssigned={assignedContactIds.includes(contact.id)}
          onToggleAssignment={onToggleAssignment}
          onContactDeleted={onContactDeleted}
        />
      ))}
    </TableBody>
  );
}