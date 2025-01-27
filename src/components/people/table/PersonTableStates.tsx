import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { AlertCircle } from "lucide-react";

export function LoadingState() {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={6} className="text-center py-8">
          <div className="flex justify-center items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent" />
            <span className="text-muted-foreground">Loading people...</span>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={6} className="text-center py-8">
          <div className="flex justify-center items-center space-x-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{message}</span>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  );
}