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
          className="cursor-pointer"
          onClick={() => onSort('name')}
        >
          Name {sortField === 'name' && (
            sortDirection === 'asc' ? <ArrowUp className="inline h-4 w-4" /> : <ArrowDown className="inline h-4 w-4" />
          )}
        </TableHead>
        <TableHead 
          className="cursor-pointer"
          onClick={() => onSort('email')}
        >
          Email {sortField === 'email' && (
            sortDirection === 'asc' ? <ArrowUp className="inline h-4 w-4" /> : <ArrowDown className="inline h-4 w-4" />
          )}
        </TableHead>
        <TableHead>Phone</TableHead>
        <TableHead>Notes</TableHead>
        <TableHead>Course Progress</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}