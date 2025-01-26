import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export function ScormUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast.error('Please upload a SCORM zip file');
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${crypto.randomUUID()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('scorm_packages')
        .upload(fileName, file);

      if (error) throw error;

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('No active session');

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: file.name.replace('.zip', ''),
          package_path: data.path,
          created_by: session.session.user.id,
          manifest_data: {
            scormVersion: "1.3",
            status: "pending_processing"
          }
        })
        .select()
        .single();

      if (courseError) throw courseError;

      toast.success('SCORM package uploaded successfully');
      // Invalidate the courses query to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    } catch (error: any) {
      toast.error('Failed to upload SCORM package: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        accept=".zip"
        onChange={handleFileUpload}
        className="hidden"
        id="scorm-upload"
      />
      <label htmlFor="scorm-upload">
        <Button disabled={isUploading} asChild>
          <span>
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload SCORM Package'}
          </span>
        </Button>
      </label>
    </div>
  );
}