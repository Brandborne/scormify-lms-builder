import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useDocumentOperations(id: string | undefined, setTitle: (title: string) => void) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const createNewDocument = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Error creating document",
        description: "You must be logged in to create documents",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          title: "Untitled Document",
          content: "",
          category: "general",
          status: "draft",
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      navigate(`/documents/${data.id}`, { replace: true });
    } catch (error) {
      toast({
        title: "Error creating document",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const loadDocument = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setTitle(data.title);
      return data.content || "";
    } catch (error) {
      toast({
        title: "Error loading document",
        description: "Please try again",
        variant: "destructive",
      });
      return "";
    }
  };

  return {
    createNewDocument,
    loadDocument
  };
}