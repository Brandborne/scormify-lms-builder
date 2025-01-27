import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Contact } from "../types";

interface ContactEditorProps {
  contact: Contact;
  onSave: () => void;
  onCancel: () => void;
}

export function ContactEditor({ contact, onSave, onCancel }: ContactEditorProps) {
  const [editValues, setEditValues] = useState({
    name: contact.name,
    email: contact.email,
    phone: contact.phone || '',
    notes: contact.notes || ''
  });

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
      onSave();
    } catch (error: any) {
      console.error('Update contact error:', error);
      toast.error('Failed to update contact: ' + error.message);
    }
  };

  return (
    <>
      <Input
        value={editValues.name}
        onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
        className="max-w-[200px]"
      />
      <Input
        value={editValues.email}
        onChange={(e) => setEditValues(prev => ({ ...prev, email: e.target.value }))}
        className="max-w-[200px]"
      />
      <Input
        value={editValues.phone}
        onChange={(e) => setEditValues(prev => ({ ...prev, phone: e.target.value }))}
        className="max-w-[150px]"
      />
      <Input
        value={editValues.notes}
        onChange={(e) => setEditValues(prev => ({ ...prev, notes: e.target.value }))}
        className="max-w-[200px]"
      />
      <div className="flex justify-end items-center gap-2">
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
          onClick={onCancel}
          className="text-red-600 hover:text-red-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}