import { DashboardHeader } from "@/components/DashboardHeader";
import { FileText } from "lucide-react";

export function DocumentsView() {
  return (
    <main className="flex-1 p-8">
      <DashboardHeader title="Documents">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">Manage your documents</span>
        </div>
      </DashboardHeader>
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">No documents yet</h3>
        <p className="text-muted-foreground">Start by adding your first document.</p>
      </div>
    </main>
  );
}