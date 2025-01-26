import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ContactsManagementProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function ContactsManagement({ variant = "default" }: ContactsManagementProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleImportContacts = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const contacts = [
        { name: "John Doe", email: "john@example.com" },
        { name: "Jane Smith", email: "jane@example.com" }
      ];

      const { error } = await supabase
        .from('contacts')
        .insert(contacts.map(contact => ({
          ...contact,
          created_by: user.id
        })));

      if (error) throw error;
      
      toast.success('Contacts imported successfully');
    } catch (error: any) {
      toast.error('Failed to import contacts: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleImportContacts}
      disabled={isLoading}
      className="w-full"
    >
      <Users className="h-4 w-4" />
      Manage Contacts
    </Button>
  );
}