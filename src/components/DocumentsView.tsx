import { DashboardHeader } from "./DashboardHeader";
import { LMSSidebar } from "./LMSSidebar";
import { DocumentList } from "./documents/DocumentList";
import { DocumentEditor } from "./documents/DocumentEditor";
import { useLocation } from "react-router-dom";

export function DocumentsView() {
  const location = useLocation();
  const isEditing = location.pathname.includes("/documents/");

  return (
    <>
      <LMSSidebar />
      <main className="flex-1 p-8">
        <DashboardHeader title="Documents">
          <div className="flex items-center gap-4">
            {/* Add document-specific actions here */}
          </div>
        </DashboardHeader>
        {isEditing ? <DocumentEditor /> : <DocumentList />}
      </main>
    </>
  );
}