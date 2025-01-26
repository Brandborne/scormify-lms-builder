import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContactItem } from "./ContactItem";

interface Contact {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface ContactListProps {
  courseId?: string;
  onToggleAssignment?: (contactId: string) => void;
  onContactDeleted: () => void;
}

export function ContactList({ courseId, onToggleAssignment, onContactDeleted }: ContactListProps) {
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Contact[];
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

  if (isLoading) {
    return <div>Loading contacts...</div>;
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Existing Contacts</h4>
      <div className="max-h-[200px] overflow-y-auto space-y-2">
        {contacts?.map((contact) => {
          const isAssigned = assignments?.includes(contact.id);
          return (
            <ContactItem
              key={contact.id}
              contact={contact}
              isAssigned={isAssigned}
              onDelete={onContactDeleted}
              onToggleAssignment={onToggleAssignment}
            />
          );
        })}
        {!contacts?.length && (
          <p className="text-sm text-muted-foreground">No contacts found</p>
        )}
      </div>
    </div>
  );
}