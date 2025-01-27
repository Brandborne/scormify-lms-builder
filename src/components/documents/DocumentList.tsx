import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export function DocumentList() {
  const navigate = useNavigate();

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => navigate("/documents/new")}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          New Document
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents?.map((doc) => (
          <Card
            key={doc.id}
            className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/documents/${doc.id}`)}
          >
            <h3 className="font-semibold mb-2">{doc.title}</h3>
            <p className="text-sm text-muted-foreground">
              Last updated:{" "}
              {new Date(doc.updated_at).toLocaleDateString()}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}