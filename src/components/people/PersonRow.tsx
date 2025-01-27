import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { PersonRowProps } from "./types";
import { PersonProgress } from "./person-details/PersonProgress";
import { PersonDetailsModal } from "./person-details/PersonDetailsModal";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { usePersonMutations } from "@/hooks/people/use-person-mutations";

export function PersonRow({
  person,
  onPersonDeleted,
}: PersonRowProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { deletePerson } = usePersonMutations();

  const handleDelete = async () => {
    await deletePerson.mutateAsync(person.id);
    onPersonDeleted();
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-4">
          <div>
            <div className="font-medium">{person.name}</div>
            <div className="text-sm text-muted-foreground">
              {person.email}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <PersonProgress 
          assignments={person.assignments}
          onOpenDetails={() => setIsDetailsOpen(true)}
        />
      </TableCell>
      <TableCell className="w-[100px]">
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Person</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {person.name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
      <PersonDetailsModal
        person={person}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </TableRow>
  );
}