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

    console.log('Selected file:', file.name, 'Size:', file.size);

    if (!file.name.toLowerCase().endsWith('.zip')) {
      console.error('Invalid file type:', file.type);
      toast.error('Please upload a SCORM zip file');
      return;
    }

    setIsUploading(true);
    try {
      console.log('Starting file upload process');
      const fileName = `${crypto.randomUUID()}-${file.name}`;
      console.log('Generated unique filename:', fileName);

      const { data, error } = await supabase.storage
        .from('scorm_packages')
        .upload(fileName, file);

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      console.log('File uploaded successfully:', data.path);

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.error('No active session found');
        throw new Error('No active session');
      }

      console.log('Creating course record in database');
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

      if (courseError) {
        console.error('Course creation error:', courseError);
        throw courseError;
      }

      console.log('Course record created:', courseData);
      console.log('Initiating SCORM processing');

      const { error: processError } = await supabase.functions.invoke('process-scorm', {
        body: { courseId: courseData.id }
      });

      if (processError) {
        console.error('SCORM processing error:', processError);
        throw processError;
      }

      console.log('SCORM package processed successfully');
      toast.success('SCORM package uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    } catch (error: any) {
      console.error('Upload process failed:', error);
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