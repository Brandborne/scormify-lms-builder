import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useParams } from "react-router-dom";
import { useDocument } from "@/hooks/use-document";
import { EditorHeader } from "./editor/EditorHeader";
import { EditorToolbar } from "./editor/EditorToolbar";

export function DocumentEditor() {
  const { id } = useParams();
  const { title, saving, setTitle, loadDocument, debouncedSave } = useDocument(id);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[500px] px-8 py-4 max-w-none leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      debouncedSave(content);
    },
  });

  useEffect(() => {
    if (id && id !== "new") {
      loadDocument().then((content) => {
        editor?.commands.setContent(content);
      });
    }
  }, [id]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    debouncedSave(editor?.getHTML() || "");
  };

  return (
    <div className="container mx-auto p-8">
      <EditorHeader
        title={title}
        saving={saving}
        onTitleChange={handleTitleChange}
      />
      <div className="bg-card border rounded-lg">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <EditorToolbar editor={editor} />
        </div>
        <div className="min-h-screen bg-white dark:bg-zinc-900">
          <div className="max-w-[800px] mx-auto">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}