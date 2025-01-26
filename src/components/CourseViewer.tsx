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

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();
      
      if (error) throw error;
      console.log('Course data:', data);
      return {
        ...data,
        manifest_data: data?.manifest_data as CourseManifestData
      };
    }
  });

  const { data: publicUrl } = useQuery({
    queryKey: ['courseUrl', course?.manifest_data?.index_path],
    enabled: !!course?.manifest_data?.index_path,
    queryFn: async () => {
      const { data } = supabase
        .storage
        .from('scorm_packages')
        .getPublicUrl(course.manifest_data.index_path!);
      
      console.log('Storage URL:', data.publicUrl);
      return data.publicUrl;
    }
  });

  useEffect(() => {
    if (courseId && !scormApiRef.current) {
      const initScormApi = async () => {
        const api = new ScormAPI(courseId);
        const success = await api.initialize();
        
        if (success) {
          scormApiRef.current = api;
          console.log('SCORM API initialized');
        } else {
          toast.error('Failed to initialize SCORM tracking');
        }
      };

      initScormApi();
    }

    return () => {
      if (scormApiRef.current) {
        scormApiRef.current.terminate();
        scormApiRef.current = null;
      }
    };
  }, [courseId]);

  if (isLoading) {
    return <div>Loading course...</div>;
  }

  if (!course) {
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
      <div className="bg-card border rounded-lg p-6">
        {publicUrl ? (
          <iframe
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