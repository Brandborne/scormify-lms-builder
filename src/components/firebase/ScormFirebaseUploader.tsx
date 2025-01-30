import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { uploadScormToFirebase } from '@/integrations/firebase/storage';
import { useToast } from '@/hooks/use-toast';

export function ScormFirebaseUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const courseId = crypto.randomUUID();
      const result = await uploadScormToFirebase(courseId, file);
      
      toast({
        title: "Upload Successful",
        description: `Index file: ${result.indexPath}`,
      });
      
      console.log('Upload result:', result);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Firebase SCORM Uploader (PoC)</h2>
      <div>
        <input
          type="file"
          accept=".zip"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
          id="scorm-file"
        />
        <label htmlFor="scorm-file">
          <Button asChild>
            <span>{isUploading ? 'Uploading...' : 'Select SCORM Package'}</span>
          </Button>
        </label>
      </div>
    </div>
  );
}