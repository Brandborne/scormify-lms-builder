import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { CourseManifestData } from "@/types/course";
import { useEffect, useRef } from "react";
import ScormAPI from "@/lib/scorm/ScormAPI";
import { toast } from "sonner";

export function CourseViewer() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const scormApiRef = useRef<ScormAPI | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const { data: course, isLoading, error: courseError } = useQuery({
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

  const { data: publicUrl, error: urlError } = useQuery({
    queryKey: ['courseUrl', course?.manifest_data?.index_path],
    enabled: !!course?.manifest_data?.index_path,
    queryFn: async () => {
      console.log('Getting public URL for path:', course.manifest_data.index_path);
      const { data } = supabase
        .storage
        .from('scorm_packages')
        .getPublicUrl(course.manifest_data.index_path!);
      
      console.log('Storage URL generated:', data.publicUrl);
      return data.publicUrl;
    }
  });

  useEffect(() => {
    if (courseId && !scormApiRef.current) {
      const initScormApi = async () => {
        console.log('Initializing SCORM API for course:', courseId);
        const api = new ScormAPI(courseId, true); // Enable debug mode
        
        // Make API available to SCORM content
        (window as any).API_1484_11 = {
          Initialize: (param: string) => api.Initialize(param),
          Terminate: (param: string) => api.Terminate(param),
          GetValue: (element: string) => api.GetValue(element),
          SetValue: (element: string, value: string) => api.SetValue(element, value),
          Commit: (param: string) => api.Commit(param),
          GetLastError: () => api.GetLastError(),
          GetErrorString: (errorCode: string) => api.GetErrorString(errorCode),
          GetDiagnostic: (errorCode: string) => api.GetDiagnostic(errorCode)
        };
        
        const success = await api.Initialize();
        
        if (success === 'true') {
          scormApiRef.current = api;
          console.log('SCORM API initialized successfully');
          toast.success('Course initialized successfully');
        } else {
          console.error('Failed to initialize SCORM API');
          toast.error('Failed to initialize course tracking');
        }
      };

      initScormApi();
    }

    return () => {
      if (scormApiRef.current) {
        console.log('Terminating SCORM API');
        scormApiRef.current.Terminate();
        scormApiRef.current = null;
        delete (window as any).API_1484_11;
      }
    };
  }, [courseId]);

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

  if (urlError) {
    console.error('Error getting course URL:', urlError);
    return <div>Error loading course content: {urlError.message}</div>;
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
      <div className="bg-card border rounded-lg p-6">
        {publicUrl ? (
          <iframe
            ref={iframeRef}
            src={publicUrl}
            className="w-full h-[600px] border-0"
            title={course.title}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div>Loading course content...</div>
        )}
      </div>
    </div>
  );
}