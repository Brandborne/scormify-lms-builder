import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

export function useDocument(id: string | undefined) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const debouncedSave = useDebounce(async (content: string) => {
    if (!id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("documents")
        .update({ content, title })
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      toast({
        title: "Error saving document",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      // Add a small delay before removing the saving indicator
      setTimeout(() => {
        setSaving(false);
      }, 500);
    }
  }, 2000); // Increased debounce time to 2 seconds for smoother saving

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

  useEffect(() => {
    if (id === "new") {
      createNewDocument();
    }
  }, [id]);

  return {
    title,
    saving,
    setTitle,
    loadDocument,
    debouncedSave
  };
}