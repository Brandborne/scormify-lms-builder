import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ContactsManagement } from "../ContactsManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

  const handleUpdateCourse = async () => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ 
          title,
          description 
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Course updated successfully');
      setIsOpen(false);
    } catch (error: any) {
      toast.error('Failed to update course: ' + error.message);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Course deleted successfully');
      onDelete();
      setIsOpen(false);
    } catch (error: any) {
      toast.error('Failed to delete course: ' + error.message);
    }
  };

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
          <TabsContent value="edit" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter course title"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter course description"
                />
              </div>
              <Button onClick={handleUpdateCourse} className="w-full">
                Save Changes
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="contacts">
            <div className="pt-2">
              <ContactsManagement courseId={id} />
            </div>
          </TabsContent>
          <TabsContent value="danger" className="space-y-4">
            <div className="rounded-lg border-2 border-destructive/50 p-4">
              <h4 className="font-medium text-destructive mb-2">Danger Zone</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete a course, there is no going back. Please be certain.
              </p>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Course
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}