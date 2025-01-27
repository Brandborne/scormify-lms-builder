import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { PersonActionsProps } from "./types";

export function PersonActions({ 
  personId,
  onEdit
}: PersonActionsProps) {
  return (
    <div className="flex justify-end items-center gap-2">
      <Button
        size="sm"
        variant="ghost"
        onClick={onEdit}
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>
  );
}