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
    <div className="mb-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/documents")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Documents
      </Button>
      <div className="flex items-center gap-4">
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-3xl font-bold bg-transparent border-none focus-visible:ring-0 px-0 h-auto"
          placeholder="Untitled Document"
        />
        {saving && (
          <div className="flex items-center text-sm text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </div>
        )}
      </div>
    </div>
  );
}