import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { CourseManifestData } from "@/types/course";
import { ScormFrame } from "./scorm/ScormFrame";
import { ScormInitializer } from "./scorm/ScormInitializer";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export function CourseViewer() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: course, isLoading, error: courseError, refetch } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      console.log('Fetching course data for ID:', courseId);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching course:', error);
        throw error;
      }
      
      console.log('Course data retrieved:', data);
      return {
        ...data,
        manifest_data: data?.manifest_data as CourseManifestData
      };
    }
  });

  const processMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('process-scorm', {
        body: { courseId }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Processing Started",
        description: "The course is being processed. Please wait a moment.",
      });
      // Refetch after a short delay to allow processing to start
      setTimeout(() => refetch(), 2000);
    },
    onError: (error) => {
      console.error('Processing error:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to process the course. Please try again.",
        variant: "destructive",
      });
    }
  });

  const { data: publicUrl } = useQuery({
    queryKey: ['courseUrl', course?.unzipped_path],
    enabled: !!course?.unzipped_path && course?.manifest_data?.status === 'processed',
    queryFn: async () => {
      console.log('Getting public URL for path:', course.unzipped_path);
      const startingPage = course.manifest_data?.startingPage || 'index.html';
      console.log('Starting page from manifest:', startingPage);
      
      // Ensure we don't have any double slashes in the path
      const cleanUnzippedPath = course.unzipped_path.replace(/\/+/g, '/');
      const cleanStartingPage = startingPage.replace(/^\/+/, '');
      const indexPath = `${cleanUnzippedPath}/${cleanStartingPage}`;
      
      console.log('Constructed index path:', indexPath);
      
      const { data } = supabase
        .storage
        .from('scorm_packages')
        .getPublicUrl(indexPath);
      
      console.log('Storage URL generated:', data.publicUrl);
      return data.publicUrl;
    }
  });

  // Automatically trigger processing if needed
  useEffect(() => {
    if (course?.manifest_data?.status === 'pending_processing') {
      processMutation.mutate();
    }
  }, [course?.manifest_data?.status]);

  if (isLoading) {
    return <div>Loading course...</div>;
  }

  if (courseError) {
    console.error('Course loading error:', courseError);
    return <div>Error loading course: {courseError.message}</div>;
  }

  if (!course) {
    console.error('No course found for ID:', courseId);
    return <div>Course not found</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>
        <h1 className="text-3xl font-bold">{course.title}</h1>
        {course.description && (
          <p className="text-muted-foreground mt-2">{course.description}</p>
        )}
      </div>

      {course.manifest_data?.status === 'pending_processing' && (
        <Alert className="mb-6">
          <AlertTitle>Course Processing</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>This course is being processed. Please wait a moment.</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              className="ml-4"
              disabled={processMutation.isPending}
            >
              <ReloadIcon className={`mr-2 h-4 w-4 ${processMutation.isPending ? 'animate-spin' : ''}`} />
              Check Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-card border rounded-lg p-6">
        {courseId && <ScormInitializer courseId={courseId} />}
        {publicUrl ? (
          <ScormFrame url={publicUrl} title={course.title} />
        ) : (
          <div>Loading course content...</div>
        )}
      </div>
    </div>
  );
}