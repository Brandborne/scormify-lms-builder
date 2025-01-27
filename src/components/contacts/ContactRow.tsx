import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContactRowProps } from "./types";
import { ContactActions } from "./ContactActions";
import { Button } from "@/components/ui/button";
import { Check, X, ListFilter } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ContactDetailsModal } from "./ContactDetailsModal";

export function ContactRow({
  contact,
  isAssigned,
  onToggleAssignment,
  onContactDeleted
}: ContactRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
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

  const totalCourses = contact.assignments?.length || 0;
  const completedCourses = contact.assignments?.filter(a => a.status === 'completed').length || 0;
  const inProgressCourses = contact.assignments?.filter(a => a.status === 'in_progress').length || 0;

  const getProgressColor = () => {
    if (totalCourses === 0) return 'bg-gray-200';
    if (completedCourses === totalCourses) return 'bg-green-500';
    if (completedCourses > 0 || inProgressCourses > 0) return 'bg-blue-500';
    return 'bg-gray-400';
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
        {totalCourses > 0 ? (
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getProgressColor()} transition-all`}
                    style={{ 
                      width: `${(completedCourses / totalCourses) * 100}%`
                    }}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDetailsModalOpen(true)}
                >
                  <ListFilter className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {completedCourses}/{totalCourses}
                </span>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-64">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Course Progress</h4>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <span className="text-muted-foreground">Total Courses:</span>
                  <span className="font-medium">{totalCourses}</span>
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="text-green-600 font-medium">{completedCourses}</span>
                  <span className="text-muted-foreground">In Progress:</span>
                  <span className="text-blue-600 font-medium">{inProgressCourses}</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">No courses assigned</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDetailsModalOpen(true)}
            >
              <ListFilter className="h-4 w-4" />
            </Button>
          </div>
        )}
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
              onDelete={handleDelete}
              onEdit={() => setIsEditing(true)}
            />
          )}
        </div>
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