import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { PersonWithAssignments } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash } from "lucide-react";

interface PersonDetailsModalProps {
  person: PersonWithAssignments;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}

export function PersonDetailsModal({
  person,
  isOpen,
  onClose,
  onDelete,
  onUpdate
}: PersonDetailsModalProps) {
  const [editValues, setEditValues] = useState({
    name: person.name,
    email: person.email,
    phone: person.phone || '',
  });

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('people')
        .update({
          name: editValues.name,
          email: editValues.email,
          phone: editValues.phone,
        })
        .eq('id', person.id);

      if (error) throw error;
      toast.success('Person updated successfully');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Update person error:', error);
      toast.error('Failed to update person: ' + error.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Person Details</DialogTitle>
          <DialogDescription>
            View and edit person information
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
              Delete Person
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