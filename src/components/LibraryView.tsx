import { DashboardHeader } from "@/components/DashboardHeader";
import { FileText } from "lucide-react";

export function LibraryView() {
  return (
    <main className="flex-1 p-8">
      <DashboardHeader title="Library">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">Coming soon</span>
        </div>
      </DashboardHeader>
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">No content yet</h3>
        <p className="text-muted-foreground">Library features are coming soon.</p>
      </div>
    </main>
  );
}