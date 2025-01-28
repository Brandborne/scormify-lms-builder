import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CourseManifestData } from "@/types/course";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { CourseHeader } from "./course/CourseHeader";
import { CourseProcessingAlert } from "./course/CourseProcessingAlert";
import { CourseErrorAlert } from "./course/CourseErrorAlert";
import { CourseContent } from "./course/CourseContent";

export function CourseViewer() {
  const { courseId } = useParams();
  const { toast } = useToast();

  const { data: course, isLoading, error: courseError, refetch } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) {
        throw new Error('Course ID is required');
      }

      const { data: courseData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();
      
      if (error) throw error;
      if (!courseData) throw new Error('Course not found');

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
      toast({
        title: "Processing Failed",
        description: "Failed to process the course. Please try again.",
        variant: "destructive",
      });
      console.error('Processing error:', error);
    }
  });

  const { data: courseUrl } = useQuery({
    queryKey: ['courseUrl', course?.course_files_path, course?.manifest_data],
    enabled: !!course?.course_files_path && course?.manifest_data?.status === 'processed',
    queryFn: async () => {
      if (!course?.course_files_path) {
        throw new Error('Missing course path');
      }

      // Use the starting page from manifest if available
      const startingPage = course.manifest_data?.startingPage || 'scormdriver/indexAPI.html';
      const coursePath = `${course.course_files_path}/${startingPage}`;
      
      // Get the public URL
      const { data } = supabase
        .storage
        .from('scorm_packages')
        .getPublicUrl(coursePath);
      
      console.log('Course URL:', data.publicUrl);
      return {
        url: data.publicUrl,
        scormVersion: course.manifest_data?.scormVersion || 'SCORM 1.2'
      };
    }
  });

  useEffect(() => {
    if (course?.manifest_data?.status === 'pending_processing') {
      processMutation.mutate();
    }
  }, [course?.manifest_data?.status]);

  if (isLoading) {
    return <div>Loading course...</div>;
  }

  if (courseError) {
    const errorMessage = courseError.message === 'Course not found' 
      ? 'The requested course could not be found. It may have been deleted.'
      : `Error loading course: ${courseError.message}`;
    
    return <CourseErrorAlert message={errorMessage} />;
  }

  if (!course) {
    return <CourseErrorAlert message="The requested course could not be found. It may have been deleted." />;
  }

  return (
    <div className="container mx-auto p-8">
      <CourseHeader 
        title={course.title} 
        description={course.description}
        scormVersion={course.manifest_data?.scormVersion}
      />
      
      {course.manifest_data?.status === 'pending_processing' && (
        <CourseProcessingAlert 
          onRefresh={() => refetch()} 
          isProcessing={processMutation.isPending} 
        />
      )}

      <CourseContent 
        courseId={courseId!} 
        title={course.title} 
        courseUrl={courseUrl}
        manifestData={course.manifest_data}
      />
    </div>
  );
}