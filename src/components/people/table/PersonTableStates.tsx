import { TableBody, TableCell, TableRow } from "@/components/ui/table";

export function LoadingState() {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={6} className="text-center py-8">
          <div className="flex justify-center items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Loading...</span>
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
        <TableCell colSpan={6} className="text-center py-8 text-destructive">
          {message}
        </TableCell>
      </TableRow>
    </TableBody>
  );
}