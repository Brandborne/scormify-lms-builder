import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { supabase } from "@/integrations/supabase/client";

export function useDocumentSave(id: string | undefined, title: string, setSaving: (saving: boolean) => void) {
  const { toast } = useToast();

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
      setTimeout(() => {
        setSaving(false);
      }, 500);
    }
  }, 2000);

  return { debouncedSave };
}