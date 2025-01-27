import { useState } from "react";
import { Table } from "@/components/ui/table";
import { PersonListProps } from "./types";
import { PersonTableHeader } from "./table/PersonTableHeader";
import { PersonTableBody } from "./table/PersonTableBody";
import { ErrorState, LoadingState } from "./table/PersonTableStates";
import { usePeople } from "@/hooks/people/use-people";

export function PersonList({
  onPersonDeleted
}: PersonListProps) {
  const [sortField, setSortField] = useState<'name' | 'email'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const {
    data: people,
    isLoading: isLoadingPeople,
    error: peopleError
  } = usePeople(sortField, sortDirection);

  const handleSort = (field: 'name' | 'email') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (peopleError) {
    return <ErrorState message={peopleError.message} />;
  }

  if (isLoadingPeople) {
    return <LoadingState />;
  }

  return (
    <div className="w-full rounded-md border">
      <Table>
        <PersonTableHeader
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
        <PersonTableBody
          people={people}
          onPersonDeleted={onPersonDeleted}
        />
      </Table>
    </div>
  );
}