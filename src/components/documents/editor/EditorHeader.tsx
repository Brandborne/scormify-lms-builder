import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EditorHeaderProps {
  title: string;
  saving: boolean;
  onTitleChange: (newTitle: string) => void;
}

export function EditorHeader({ title, saving, onTitleChange }: EditorHeaderProps) {
  const navigate = useNavigate();

  return (
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
        onChange={(e) => onTitleChange(e.target.value)}
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
  );
}