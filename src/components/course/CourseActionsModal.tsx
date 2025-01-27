import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ContactsManagement } from "../ContactsManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseEditForm } from "./CourseEditForm";
import { CourseDangerZone } from "./CourseDangerZone";

interface CourseActionsModalProps {
  id: string;
  initialTitle: string;
  initialDescription?: string;
  onDelete: () => void;
}

export function CourseActionsModal({ 
  id, 
  initialTitle, 
  initialDescription = "",
  onDelete 
}: CourseActionsModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Course Actions</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="danger">Danger</TabsTrigger>
          </TabsList>
          <TabsContent value="edit">
            <CourseEditForm
              id={id}
              initialTitle={initialTitle}
              initialDescription={initialDescription}
              onSuccess={() => setIsOpen(false)}
            />
          </TabsContent>
          <TabsContent value="contacts">
            <div className="pt-2">
              <ContactsManagement courseId={id} />
            </div>
          </TabsContent>
          <TabsContent value="danger" className="space-y-4">
            <CourseDangerZone
              id={id}
              onDelete={() => {
                onDelete();
                setIsOpen(false);
              }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}