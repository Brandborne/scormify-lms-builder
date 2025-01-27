import { useQueryClient } from "@tanstack/react-query";
import { PersonList } from "./people/PersonList";
import { usePersonMutations } from "@/hooks/people/use-person-mutations";

export function PeopleManagement() {
  const queryClient = useQueryClient();
  const { deletePerson } = usePersonMutations();

  const handlePersonDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ['people'] });
  };

  return (
    <div className="w-full">
      <PersonList 
        onPersonDeleted={handlePersonDeleted}
      />
    </div>
  );
}