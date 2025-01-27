import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ContactFormProps {
  onSuccess: () => void;
}

export function ContactForm({ onSuccess }: ContactFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", email: "" });
  const queryClient = useQueryClient();

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
      // Invalidate contacts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      onSuccess();
    } catch (error: any) {
      toast.error('Failed to add contact: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
  );
}