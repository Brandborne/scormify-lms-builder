import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

export function DocumentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      debouncedSave(content);
    },
  });

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
      setSaving(false);
    }
  }, 1000);

  useEffect(() => {
    if (id === "new") {
      createNewDocument();
    } else {
      loadDocument();
    }
  }, [id]);

  const createNewDocument = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          title: "Untitled Document",
          content: "",
          category: "general",
          status: "draft",
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
      editor?.commands.setContent(data.content || "");
    } catch (error) {
      toast({
        title: "Error loading document",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/documents")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            debouncedSave(editor?.getHTML() || "");
          }}
          className="text-xl font-semibold"
          placeholder="Untitled Document"
        />
        {saving && (
          <span className="text-sm text-muted-foreground">Saving...</span>
        )}
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none"
      />
    </div>
  );
}