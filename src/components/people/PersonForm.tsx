import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface PersonFormProps {
  onSuccess: () => void;
}

export function PersonForm({ onSuccess }: PersonFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newPerson, setNewPerson] = useState({ name: "", email: "" });
  const queryClient = useQueryClient();

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Check if person already exists
      const { data: existingPeople } = await supabase
        .from('people')
        .select('email')
        .eq('email', newPerson.email);

      if (existingPeople && existingPeople.length > 0) {
        toast.error('Person with this email already exists');
        return;
      }

      const { error } = await supabase
        .from('people')
        .insert([{
          ...newPerson,
          created_by: user.id
        }]);

      if (error) throw error;
      
      toast.success('Person added successfully');
      setNewPerson({ name: "", email: "" });
      // Invalidate people query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['people'] });
      onSuccess();
    } catch (error: any) {
      toast.error('Failed to add person: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleAddPerson} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={newPerson.name}
          onChange={(e) => setNewPerson(prev => ({ ...prev, name: e.target.value }))}
          placeholder="John Doe"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={newPerson.email}
          onChange={(e) => setNewPerson(prev => ({ ...prev, email: e.target.value }))}
          placeholder="john@example.com"
          required
        />
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Person
      </Button>
    </form>
  );
}