import { DashboardHeader } from "./DashboardHeader";
import { LMSSidebar } from "./LMSSidebar";

export function SettingsView() {
  return (
    <>
      <LMSSidebar />
      <main className="flex-1 p-8">
        <DashboardHeader title="Settings">
          <div className="flex items-center gap-4">
            {/* Add settings-specific actions here */}
          </div>
        </DashboardHeader>
        <div className="flex flex-col items-center justify-center h-[60vh] max-w-[1400px] mx-auto">
          <h2 className="text-2xl font-semibold mb-2">Settings</h2>
          <p className="text-muted-foreground">Settings configuration is coming soon.</p>
        </div>
      </main>
    </>
  );
}