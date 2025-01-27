import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash, Edit2, Check, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
}

interface CourseAssignment {
  course_title: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_at: string;
  completed_at: string | null;
}

interface ContactWithAssignments extends Contact {
  assignments?: CourseAssignment[];
}

interface ContactListProps {
  courseId?: string;
  onToggleAssignment?: (contactId: string) => void;
  onContactDeleted: () => void;
}

export function ContactList({ courseId, onToggleAssignment, onContactDeleted }: ContactListProps) {
  const [sortField, setSortField] = useState<'name' | 'email' | 'created_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Contact>>({});

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts', sortField, sortDirection],
    queryFn: async () => {
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });
      
      if (contactsError) throw contactsError;

      // Fetch course assignments for each contact
      const contactsWithAssignments = await Promise.all(
        contactsData.map(async (contact) => {
          const { data: assignments, error: assignmentsError } = await supabase
            .from('contact_course_progress')
            .select('course_title, status, assigned_at, completed_at')
            .eq('contact_id', contact.id);
          
          if (assignmentsError) {
            console.error('Error fetching assignments:', assignmentsError);
            return contact;
          }

          return {
            ...contact,
            assignments: assignments || [],
          };
        })
      );
      
      return contactsWithAssignments as ContactWithAssignments[];
    }
  });

  const { data: assignments } = useQuery({
    queryKey: ['course_assignments', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from('course_assignments')
        .select('contact_id')
        .eq('course_id', courseId);
      
      if (error) throw error;
      return data.map(a => a.contact_id);
    },
    enabled: !!courseId
  });

  const handleSort = (field: 'name' | 'email' | 'created_at') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
      toast.success('Contact deleted successfully');
      onContactDeleted();
    } catch (error: any) {
      console.error('Delete contact error:', error);
      toast.error('Failed to delete contact: ' + error.message);
    }
  };

  const startEditing = (contact: Contact) => {
    setEditingContact(contact.id);
    setEditValues({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      notes: contact.notes,
    });
  };

  const cancelEditing = () => {
    setEditingContact(null);
    setEditValues({});
  };

  const saveEditing = async () => {
    if (!editingContact || !editValues.name || !editValues.email) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          name: editValues.name,
          email: editValues.email,
          phone: editValues.phone,
          notes: editValues.notes,
        })
        .eq('id', editingContact);

      if (error) throw error;
      toast.success('Contact updated successfully');
      setEditingContact(null);
      setEditValues({});
    } catch (error: any) {
      console.error('Update contact error:', error);
      toast.error('Failed to update contact: ' + error.message);
    }
  };

  if (isLoading) {
    return <div>Loading contacts...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Existing Contacts</h4>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('name')}
              >
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('email')}
              >
                Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Assigned Courses</TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('created_at')}
              >
                Created At {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts?.map((contact) => {
              const isAssigned = assignments?.includes(contact.id);
              const isEditing = editingContact === contact.id;

              return (
                <TableRow key={contact.id}>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editValues.name || ''}
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
                        value={editValues.email || ''}
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
                        value={editValues.phone || ''}
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
                        value={editValues.notes || ''}
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
                    {new Date(contact.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      {onToggleAssignment && (
                        <Switch
                          checked={isAssigned}
                          onCheckedChange={() => onToggleAssignment(contact.id)}
                          aria-label={`Toggle assignment for ${contact.name}`}
                        />
                      )}
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={saveEditing}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(contact)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteContact(contact.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!contacts?.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No contacts found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}