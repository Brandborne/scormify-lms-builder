import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

interface PersonTableHeaderProps {
  sortField: 'name' | 'email';
  sortDirection: 'asc' | 'desc';
  onSort: (field: 'name' | 'email') => void;
  icon?: React.ReactNode;
}

export function PersonTableHeader({
  sortField,
  sortDirection,
  onSort,
  icon
}: PersonTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>
          <div className="flex items-center gap-2">
            {icon}
            <Button
              variant="ghost"
              onClick={() => onSort('name')}
              className="hover:bg-transparent"
            >
              Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TableHead>
        <TableHead>Progress</TableHead>
      </TableRow>
    </TableHeader>
  );
}