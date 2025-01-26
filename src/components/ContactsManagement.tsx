import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";

interface Contact {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface ContactsManagementProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function ContactsManagement({ variant = "default" }: ContactsManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", email: "" });
  const [isOpen, setIsOpen] = useState(false);

  const { data: contacts, refetch } = useQuery({
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

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Check if contact already exists
      const { data: existingContacts } = await supabase
        .from('contacts')
        .select('email')
        .eq('email', newContact.email);

      if (existingContacts && existingContacts.length > 0) {
        toast.error('Contact with this email already exists');
        return;
      }

      const { error } = await supabase
        .from('contacts')
        .insert([{
          ...newContact,
          created_by: user.id
        }]);

      if (error) throw error;
      
      toast.success('Contact added successfully');
      setNewContact({ name: "", email: "" });
      refetch();
    } catch (error: any) {
      toast.error('Failed to add contact: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className="w-full">
          <Users className="h-4 w-4 mr-2" />
          Manage Contacts
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contact Management</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <form onSubmit={handleAddContact} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newContact.name}
                onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
                required
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </form>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Existing Contacts</h4>
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {contacts?.map((contact) => (
                <div
                  key={contact.id}
                  className="flex justify-between items-center p-2 bg-secondary rounded-md"
                >
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                  </div>
                </div>
              ))}
              {!contacts?.length && (
                <p className="text-sm text-muted-foreground">No contacts found</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}