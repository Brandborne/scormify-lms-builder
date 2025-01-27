import { DashboardHeader } from "./DashboardHeader";
import { LMSSidebar } from "./LMSSidebar";
import { PeopleManagement } from "./PeopleManagement";
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
import { PersonForm } from "./people/PersonForm";

export function PeopleView() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <LMSSidebar />
      <main className="flex-1 p-8">
        <DashboardHeader title="People">
          <div className="flex items-center gap-4">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Person
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Person</DialogTitle>
                </DialogHeader>
                <PersonForm onSuccess={() => setIsOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </DashboardHeader>
        <div className="mt-8">
          <PeopleManagement />
        </div>
      </main>
    </>
  );
}