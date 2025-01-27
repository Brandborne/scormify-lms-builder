import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";

interface ContactTableHeaderProps {
  sortField: 'name' | 'email';
  sortDirection: 'asc' | 'desc';
  onSort: (field: 'name' | 'email') => void;
}

export function ContactTableHeader({ 
  sortField, 
  sortDirection, 
  onSort 
}: ContactTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead 
          className="w-[300px] cursor-pointer"
          onClick={() => onSort('name')}
        >
          Contact Details {sortField === 'name' && (
            sortDirection === 'asc' ? <ArrowUp className="inline h-4 w-4" /> : <ArrowDown className="inline h-4 w-4" />
          )}
        </TableHead>
        <TableHead>Course Progress</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}