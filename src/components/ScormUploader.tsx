import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import JSZip from "jszip";
import { PackageValidator } from "@/lib/scorm/validators/PackageValidator";

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
      
      // Load and validate zip content
      const zipContent = await JSZip.loadAsync(file);
      const validationResult = await PackageValidator.validatePackageStructure(zipContent);

      if (!validationResult.isValid) {
        console.error('Package validation failed:', validationResult.errors);
        toast.error(`Invalid SCORM package: ${validationResult.errors.join(', ')}`);
        return;
      }

      const courseId = crypto.randomUUID();
      const originalZipPath = `Courses/${courseId}/original/${file.name}`;
      const courseFilesPath = `Courses/${courseId}/course_files`;
      
      console.log('Generated storage paths:', {
        originalZipPath,
        courseFilesPath
      });

      // Upload original zip file
      const { data, error } = await supabase.storage
        .from('scorm_packages')
        .upload(originalZipPath, file);

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      console.log('Original zip file uploaded successfully:', data.path);

      // Get current session
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.error('No active session found');
        throw new Error('No active session');
      }

      // Create initial course record
      console.log('Creating course record in database');
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          id: courseId,
          title: validationResult.manifest?.title || file.name.replace('.zip', ''),
          original_zip_path: data.path,
          course_files_path: courseFilesPath,
          created_by: session.session.user.id,
          processing_stage: 'uploading',
          manifest_data: {
            title: validationResult.manifest?.title,
            description: validationResult.manifest?.description,
            version: validationResult.manifest?.version,
            scormVersion: validationResult.manifest?.version || "1.2"
          }
        })
        .select()
        .single();

      if (courseError) {
        console.error('Course creation error:', courseError);
        throw courseError;
      }

      console.log('Course record created:', courseData);

      // Convert file to base64 for Edge Function
      const reader = new FileReader();
      const fileBase64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await fileBase64Promise;
      const base64Content = (base64Data as string).split(',')[1];

      // Stage 1: Upload and unzip
      console.log('Starting Stage 1: Upload and unzip');
      const { error: uploadError } = await supabase.functions.invoke('upload-scorm', {
        body: { courseId: courseData.id, fileData: base64Content }
      });

      if (uploadError) {
        console.error('Upload stage error:', uploadError);
        throw uploadError;
      }

      // Stage 2: Process SCORM
      console.log('Starting Stage 2: SCORM processing');
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