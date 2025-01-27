import { DashboardHeader } from "./DashboardHeader";
import { LMSSidebar } from "./LMSSidebar";

export function DocumentsView() {
  return (
    <>
      <LMSSidebar />
      <main className="flex-1 p-8">
        <DashboardHeader title="Documents">
          <div className="flex items-center gap-4">
            {/* Add document-specific actions here */}
          </div>
        </DashboardHeader>
        <div className="flex flex-col items-center justify-center h-[60vh] max-w-[1400px] mx-auto">
          <h2 className="text-2xl font-semibold mb-2">No Documents Yet</h2>
          <p className="text-muted-foreground">Document management features are coming soon.</p>
        </div>
      </main>
    </>
  );
}
