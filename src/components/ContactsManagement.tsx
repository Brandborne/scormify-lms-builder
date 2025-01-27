import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ContactForm } from "./contacts/ContactForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Badge } from "./ui/badge";

interface ContactsManagementProps {
  courseId?: string;
}

export function ContactsManagement({ courseId }: ContactsManagementProps) {
  const [open, setOpen] = useState(false);
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);

  // Fetch all contacts with better error handling and debugging
  const { data: allContacts = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      console.log('Fetching all contacts...');
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching contacts:', error);
        toast.error('Failed to fetch contacts');
        throw error;
      }
      
      console.log('Contacts fetched:', data);
      return data || [];
    }
  });

  // Fetch assigned contacts with better error handling
  const { 
    data: assignedContacts = [], 
    isLoading: isLoadingAssignments,
    refetch: refetchAssignments 
  } = useQuery({
    queryKey: ['course_assignments', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      
      console.log('Fetching assigned contacts for course:', courseId);
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id,
          name,
          email,
          course_assignments!inner(
            status,
            assigned_at,
            completed_at
          )
        `)
        .eq('course_assignments.course_id', courseId);

      if (error) {
        console.error('Error fetching assigned contacts:', error);
        toast.error('Failed to fetch assigned contacts');
        throw error;
      }

      console.log('Assigned contacts fetched:', data);
      
      return (data || []).map(contact => ({
        contact_id: contact.id,
        contact_name: contact.name,
        contact_email: contact.email,
        status: contact.course_assignments[0].status,
        assigned_at: contact.course_assignments[0].assigned_at,
        completed_at: contact.course_assignments[0].completed_at
      }));
    },
    enabled: !!courseId
  });

  // Filter out already assigned contacts with debugging
  const unassignedContacts = allContacts.filter(
    contact => !assignedContacts.some(
      assigned => assigned.contact_id === contact.id
    )
  );
  console.log('Unassigned contacts:', unassignedContacts);

  const handleAssignContacts = async (contactId: string) => {
    if (!courseId) {
      toast.error('No course selected');
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('course_assignments')
        .insert([{
          course_id: courseId,
          contact_id: contactId,
        }]);

      if (insertError) {
        if (insertError.code === '23505') {
          toast.error('Contact already assigned');
        } else {
          throw insertError;
        }
      } else {
        toast.success('Contact assigned');
        await refetchAssignments();
      }
    } catch (error: any) {
      toast.error(`Failed to assign contact: ${error.message}`);
    }
  };

  const handleUnassign = async (contactId: string) => {
    if (!courseId) return;

    try {
      await supabase
        .from('course_assignments')
        .delete()
        .match({ 
          course_id: courseId, 
          contact_id: contactId 
        });
      
      toast.success('Contact unassigned');
      await refetchAssignments();
    } catch (error: any) {
      toast.error(`Failed to unassign contact: ${error.message}`);
    }
  };

  const getStatusBadgeColor = (status: string | null) => {
    switch(status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoadingContacts || isLoadingAssignments) {
    return <div className="p-4 text-center text-muted-foreground">Loading contacts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between"
            >
              Assign contacts
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start" side="bottom">
            {isLoadingContacts ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading contacts...
              </div>
            ) : !unassignedContacts?.length ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No contacts available to assign.
                <Button 
                  variant="ghost" 
                  className="mt-2 w-full"
                  onClick={() => {
                    setIsNewContactModalOpen(true);
                    setOpen(false);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add new contact
                </Button>
              </div>
            ) : (
              <Command>
                <CommandInput placeholder="Search contacts..." />
                <CommandEmpty>
                  No contact found.
                  <Button 
                    variant="ghost" 
                    className="mt-2 w-full"
                    onClick={() => {
                      setIsNewContactModalOpen(true);
                      setOpen(false);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add new contact
                  </Button>
                </CommandEmpty>
                <CommandGroup>
                  {unassignedContacts.map((contact) => (
                    <CommandItem
                      key={contact.id}
                      onSelect={() => {
                        handleAssignContacts(contact.id);
                        setOpen(false);
                      }}
                    >
                      <Check className="mr-2 h-4 w-4 opacity-0" />
                      <div className="flex flex-col">
                        <span>{contact.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {contact.email}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            )}
          </PopoverContent>
        </Popover>

        <Dialog open={isNewContactModalOpen} onOpenChange={setIsNewContactModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
              <DialogDescription>
                Add a new contact to your contacts list.
              </DialogDescription>
            </DialogHeader>
            <ContactForm onSuccess={() => {
              setIsNewContactModalOpen(false);
              refetchAssignments();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {assignedContacts.map((assignment) => (
          <div
            key={assignment.contact_id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex flex-col">
              <span className="font-medium">{assignment.contact_name}</span>
              <span className="text-sm text-muted-foreground">
                {assignment.contact_email}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="secondary"
                  className={cn("text-white", getStatusBadgeColor(assignment.status))}
                >
                  {assignment.status || 'pending'}
                </Badge>
                {assignment.assigned_at && (
                  <span className="text-xs text-muted-foreground">
                    Assigned: {format(new Date(assignment.assigned_at), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUnassign(assignment.contact_id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {assignedContacts.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            No contacts assigned to this course
          </div>
        )}
      </div>
    </div>
  );
}
