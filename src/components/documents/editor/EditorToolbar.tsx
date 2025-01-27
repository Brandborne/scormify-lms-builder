import { Editor } from "@tiptap/react";
import { ToolbarButton } from "./ToolbarButton";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  TextQuote,
  Minus,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const handleTextStyleChange = (value: string) => {
    editor.chain().focus().clearNodes().run();
    
    switch(value) {
      case 'title':
        editor.chain().focus().setHeading({ level: 1 }).run();
        break;
      case 'subtitle':
        editor.chain().focus().setHeading({ level: 2 }).run();
        break;
      case 'heading':
        editor.chain().focus().setHeading({ level: 3 }).run();
        break;
      case 'normal':
        editor.chain().focus().setParagraph().run();
        break;
      case 'small':
        editor.chain().focus().setParagraph().run();
        editor.chain().focus().setMark('textStyle', { class: 'text-sm' }).run();
        break;
    }
  };

  const handleLineHeightChange = (value: string) => {
    const lineHeightClass = `leading-${value}`;
    editor.chain().focus().setMark('textStyle', { class: lineHeightClass }).run();
  };

  return (
    <div className="p-2 flex items-center gap-1 flex-wrap">
      <Select onValueChange={handleTextStyleChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Text style" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="title">Title</SelectItem>
          <SelectItem value="subtitle">Subtitle</SelectItem>
          <SelectItem value="heading">Heading</SelectItem>
          <SelectItem value="normal">Normal</SelectItem>
          <SelectItem value="small">Small</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6" />

      <Select onValueChange={handleLineHeightChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Line height" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tight">Tight</SelectItem>
          <SelectItem value="snug">Snug</SelectItem>
          <SelectItem value="normal">Normal</SelectItem>
          <SelectItem value="relaxed">Relaxed</SelectItem>
          <SelectItem value="loose">Loose</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}