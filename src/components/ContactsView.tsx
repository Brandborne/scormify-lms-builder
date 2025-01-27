import { DashboardHeader } from "@/components/DashboardHeader";
import { Users } from "lucide-react";
import { LMSSidebar } from "./LMSSidebar";

export function ContactsView() {
  return (
    <div className="flex h-screen">
      <LMSSidebar />
      <main className="flex-1 p-8">
        <DashboardHeader title="Contacts">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">Manage your contacts</span>
          </div>
        </DashboardHeader>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No contacts yet</h3>
          <p className="text-muted-foreground">Start by adding your first contact.</p>
        </div>
      </main>
    </div>
  );
}