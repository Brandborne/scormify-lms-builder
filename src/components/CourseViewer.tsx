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

  console.log('CourseViewer mounted with courseId from URL:', courseId);

  const { data: course, isLoading, error: courseError, refetch } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      console.log('Fetching course data for ID:', courseId);
      
      if (!courseId) {
        console.error('No course ID provided');
        throw new Error('Course ID is required');
      }

      const { data: courseData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching course:', error);
        throw error;
      }
      
      console.log('Course data retrieved:', courseData);
      
      if (!courseData) {
        console.error('No course found with ID:', courseId);
        throw new Error('Course not found');
      }

      return {
        ...courseData,
        manifest_data: courseData.manifest_data as CourseManifestData
      };
    },
    retry: 1
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
    queryKey: ['courseUrl', course?.unzipped_path, course?.manifest_data?.index_path],
    enabled: !!course?.unzipped_path && course?.manifest_data?.status === 'processed',
    queryFn: async () => {
      if (!course?.manifest_data?.index_path) {
        console.error('No index path found in manifest data');
        throw new Error('Missing index path');
      }

      console.log('Getting public URL for manifest index path:', course.manifest_data.index_path);
      
      const { data } = supabase
        .storage
        .from('scorm_packages')
        .getPublicUrl(course.manifest_data.index_path);
      
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
    return (
      <div className="container mx-auto p-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {courseError.message === 'Course not found' 
              ? 'The requested course could not be found. It may have been deleted.'
              : `Error loading course: ${courseError.message}`
            }
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!course) {
    console.error('No course found for ID:', courseId);
    return (
      <div className="container mx-auto p-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Course Not Found</AlertTitle>
          <AlertDescription>
            The requested course could not be found. It may have been deleted.
          </AlertDescription>
        </Alert>
      </div>
    );
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
        {courseId && course && <ScormInitializer courseId={courseId} />}
        {publicUrl ? (
          <ScormFrame url={publicUrl} title={course.title} />
        ) : (
          <div>Loading course content...</div>
        )}
      </div>
    </div>
  );
}
