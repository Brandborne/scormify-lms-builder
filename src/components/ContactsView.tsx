import { DashboardHeader } from "./DashboardHeader";
import { LMSSidebar } from "./LMSSidebar";
import { ContactsManagement } from "./ContactsManagement";

export function ContactsView() {
  return (
    <div className="flex h-screen overflow-hidden">
      <LMSSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <DashboardHeader title="Contacts">
            <div className="flex items-center gap-4">
              {/* Add contact-specific actions here */}
            </div>
          </DashboardHeader>
          <div className="max-w-[1400px] mx-auto">
            <ContactsManagement />
          </div>
        </div>
      </main>
    </div>
  );
}