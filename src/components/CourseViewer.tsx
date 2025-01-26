import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CourseViewer() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: publicUrl } = useQuery({
    queryKey: ['courseUrl', course?.package_path],
    enabled: !!course?.package_path,
    queryFn: async () => {
      const { data } = supabase
        .storage
        .from('scorm_packages')
        .getPublicUrl(course.package_path);
      
      // The SCORM package is a zip file, we need to get the index.html inside it
      const basePath = data.publicUrl.split('.zip')[0];
      return `${basePath}/index.html`;
    }
  });

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
          />
        ) : (
          <div>Loading course content...</div>
        )}
      </div>
    </div>
  );
}