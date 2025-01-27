import { DashboardHeader } from "./DashboardHeader";
import { LMSSidebar } from "./LMSSidebar";

export function LibraryView() {
  return (
    <>
      <LMSSidebar />
      <main className="flex-1 p-8">
        <DashboardHeader title="Library">
          <div className="flex items-center gap-4">
            {/* Add library-specific actions here */}
          </div>
        </DashboardHeader>
        <div className="flex flex-col items-center justify-center h-[60vh] max-w-[1400px] mx-auto">
          <h2 className="text-2xl font-semibold mb-2">No Library Content Yet</h2>
          <p className="text-muted-foreground">Library features are coming soon.</p>
        </div>
      </main>
    </>
  );
}
