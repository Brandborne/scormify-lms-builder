import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Contact } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash } from "lucide-react";

interface ContactDetailsModalProps {
  contact: Contact;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export function ContactDetailsModal({
  contact,
  isOpen,
  onClose,
  onDelete
}: ContactDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    name: contact.name,
    email: contact.email,
    phone: contact.phone || '',
  });

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          name: editValues.name,
          email: editValues.email,
          phone: editValues.phone,
        })
        .eq('id', contact.id);

      if (error) throw error;
      toast.success('Contact updated successfully');
      onClose();
    } catch (error: any) {
      console.error('Update contact error:', error);
      toast.error('Failed to update contact: ' + error.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact Details</DialogTitle>
          <DialogDescription>
            View and edit contact information
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={editValues.name}
              onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={editValues.email}
              onChange={(e) => setEditValues(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={editValues.phone}
              onChange={(e) => setEditValues(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div className="flex justify-between pt-4">
            <Button
              variant="destructive"
              onClick={onDelete}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete Contact
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}