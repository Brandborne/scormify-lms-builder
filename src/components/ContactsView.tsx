import { DashboardHeader } from "./DashboardHeader";
import { LMSSidebar } from "./LMSSidebar";
import { ContactsManagement } from "./ContactsManagement";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ContactForm } from "./contacts/ContactForm";

export function ContactsView() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <LMSSidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container py-8">
          <DashboardHeader title="Contacts">
            <div className="flex items-center gap-4">
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Contact</DialogTitle>
                  </DialogHeader>
                  <ContactForm onSuccess={() => setIsOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </DashboardHeader>
          <div className="mt-8">
            <ContactsManagement />
          </div>
        </div>
      </main>
    </div>
  );
}