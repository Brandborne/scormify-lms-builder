import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PersonTableHeaderProps {
  sortField: 'name' | 'email';
  sortDirection: 'asc' | 'desc';
  onSort: (field: 'name' | 'email') => void;
  hideActions?: boolean;
}

export function PersonTableHeader({ 
  sortField, 
  sortDirection,
  onSort,
  hideActions = false
}: PersonTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>
          <Button
            variant="ghost"
            onClick={() => onSort('name')}
            className="font-medium"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </TableHead>
        <TableHead>
          <Button
            variant="ghost"
            onClick={() => onSort('email')}
            className="font-medium"
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </TableHead>
        <TableHead>Course Progress</TableHead>
        {!hideActions && <TableHead className="text-right">Actions</TableHead>}
      </TableRow>
    </TableHeader>
  );
}