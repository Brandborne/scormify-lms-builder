import { TableCell, TableRow } from "@/components/ui/table";
import { PersonRowProps } from "./types";
import { Button } from "@/components/ui/button";
import { Trash2, UserMinus } from "lucide-react";
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
import { PersonProgress } from "./person-details/PersonProgress";

export function PersonRow({
  person,
  onPersonDeleted,
  onRemoveFromCourse
}: PersonRowProps) {
  return (
    <TableRow>
      <TableCell>{person.name}</TableCell>
      <TableCell>{person.email}</TableCell>
      <TableCell>
        <PersonProgress
          assignments={person.assignments}
          onOpenDetails={() => {}}
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          {onRemoveFromCourse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemoveFromCourse(person.id)}
              className="text-destructive hover:text-destructive"
            >
              <UserMinus className="h-4 w-4" />
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Person</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this person? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onPersonDeleted()}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}