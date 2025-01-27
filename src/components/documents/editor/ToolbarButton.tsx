import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ToolbarButtonProps {
  isActive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function ToolbarButton({ 
  isActive = false, 
  onClick, 
  children 
}: ToolbarButtonProps) {
  return (
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
}