import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContactRowProps } from "./types";
import { ContactActions } from "./ContactActions";
import { getStatusColor, formatDate } from "./utils/contactUtils";
import { Button } from "@/components/ui/button";
import { Edit2, Check, X } from "lucide-react";

export function ContactRow({
  contact,
  isAssigned,
  onToggleAssignment,
  onContactDeleted
}: ContactRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    name: contact.name,
    email: contact.email,
    phone: contact.phone || '',
    notes: contact.notes || ''
  });

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

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          name: editValues.name,
          email: editValues.email,
          phone: editValues.phone,
          notes: editValues.notes,
        })
        .eq('id', contact.id);

      if (error) throw error;
      toast.success('Contact updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Update contact error:', error);
      toast.error('Failed to update contact: ' + error.message);
    }
  };

  return (
    <TableRow>
      <TableCell>
        {isEditing ? (
          <Input
            value={editValues.name}
            onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
            className="max-w-[200px]"
          />
        ) : (
          contact.name
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            value={editValues.email}
            onChange={(e) => setEditValues(prev => ({ ...prev, email: e.target.value }))}
            className="max-w-[200px]"
          />
        ) : (
          contact.email
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            value={editValues.phone}
            onChange={(e) => setEditValues(prev => ({ ...prev, phone: e.target.value }))}
            className="max-w-[150px]"
          />
        ) : (
          contact.phone || '-'
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            value={editValues.notes}
            onChange={(e) => setEditValues(prev => ({ ...prev, notes: e.target.value }))}
            className="max-w-[200px]"
          />
        ) : (
          contact.notes || '-'
        )}
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          {contact.assignments && contact.assignments.length > 0 ? (
            contact.assignments.map((assignment, index) => (
              <div key={index} className="text-sm">
                <span className="font-medium">{assignment.course_title}</span>
                <span className={`ml-2 ${getStatusColor(assignment.status)}`}>
                  ({assignment.status.replace('_', ' ')})
                </span>
              </div>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">No courses assigned</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        {formatDate(contact.created_at)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end items-center gap-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSave}
                className="text-green-600 hover:text-green-700"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <ContactActions
              contactId={contact.id}
              isAssigned={isAssigned}
              onToggleAssignment={onToggleAssignment}
              onDelete={handleDelete}
              onEdit={() => setIsEditing(true)}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}