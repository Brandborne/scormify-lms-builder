import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { uploadScormToFirebase } from '@/integrations/firebase/storage';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { initializeFirebaseStorage } from '@/integrations/firebase/config';

export function ScormFirebaseUploader() {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.zip')) {
      console.log('Invalid file type:', file.type);
      toast.error('Please upload a SCORM zip file');
      return;
    }

    setIsUploading(true);
    try {
      console.log('Fetching Firebase config from Edge Function...');
      // Get Firebase config from Edge Function
      const { data: configData, error: configError } = await supabase.functions.invoke('get-firebase-config');
      
      if (configError) {
        console.error('Error fetching Firebase config:', configError);
        throw new Error('Failed to initialize Firebase');
      }

      console.log('Firebase config received, initializing storage...');
      // Initialize Firebase with the config
      await initializeFirebaseStorage(configData);

      const courseId = crypto.randomUUID();
      console.log('Starting upload for course:', courseId);
      
      const result = await uploadScormToFirebase(courseId, file);
      console.log('Upload completed successfully:', result);
      
      toast.success('SCORM package uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload SCORM package');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        accept=".zip"
        onChange={handleFileChange}
        disabled={isUploading}
        className="hidden"
        id="firebase-scorm-upload"
      />
      <label htmlFor="firebase-scorm-upload">
        <Button disabled={isUploading} asChild>
          <span>
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload to Firebase (PoC)'}
          </span>
        </Button>
      </label>
    </div>
  );
}