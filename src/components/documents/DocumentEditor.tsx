import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Loader2, 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Quote 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export function DocumentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] px-8 py-4",
      },
    },
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
      editor?.commands.setContent(data.content || "");
    } catch (error) {
      toast({
        title: "Error loading document",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const ToolbarButton = ({ 
    isActive = false, 
    onClick, 
    children 
  }: { 
    isActive?: boolean, 
    onClick: () => void, 
    children: React.ReactNode 
  }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "h-8 w-8 p-0",
        isActive && "bg-muted text-muted-foreground"
      )}
    >
      {children}
    </Button>
  );

  return (
    <div className="max-w-[850px] mx-auto">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-4 p-4">
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
            className="text-xl font-semibold bg-transparent border-none focus-visible:ring-0 px-0 h-auto"
            placeholder="Untitled Document"
          />
          {saving && (
            <div className="flex items-center text-sm text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </div>
          )}
        </div>
        <div className="border-t flex items-center gap-1 p-2">
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBold().run()}
            isActive={editor?.isActive("bold")}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            isActive={editor?.isActive("italic")}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <div className="w-px h-4 bg-border mx-2" />
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor?.isActive("heading", { level: 1 })}
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor?.isActive("heading", { level: 2 })}
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor?.isActive("heading", { level: 3 })}
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
          <div className="w-px h-4 bg-border mx-2" />
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            isActive={editor?.isActive("bulletList")}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            isActive={editor?.isActive("orderedList")}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            isActive={editor?.isActive("blockquote")}
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>
      <div className="min-h-screen bg-white dark:bg-zinc-900">
        <EditorContent
          editor={editor}
          className="prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none"
        />
      </div>
    </div>
  );
}
