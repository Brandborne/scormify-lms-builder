import { TableCell, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { PersonRowProps } from "./types";

export function PersonRow({
  person,
}: PersonRowProps) {
  // Calculate progress for this specific course
  const courseAssignment = person.assignments?.[0];
  const progress = courseAssignment?.status === 'completed' ? 100 : 
                  courseAssignment?.status === 'in_progress' ? 50 : 0;

  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium">{person.name}</p>
          <p className="text-sm text-muted-foreground">{person.email}</p>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {courseAssignment?.status === 'completed' ? 'Completed' :
             courseAssignment?.status === 'in_progress' ? 'In Progress' : 
             'Not Started'}
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
}