import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Edit2, Trash, Check, X } from "lucide-react";
import { ContactActionsProps } from "./types";

export function ContactActions({ 
  contactId,
  isAssigned = false,
  onToggleAssignment,
  onDelete
}: ContactActionsProps) {
  return (
    <div className="flex justify-end items-center gap-2">
      {onToggleAssignment && (
        <Switch
          checked={isAssigned}
          onCheckedChange={() => onToggleAssignment(contactId)}
          aria-label={`Toggle assignment for contact ${contactId}`}
        />
      )}
      <Button
        size="sm"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        onClick={onDelete}
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
}