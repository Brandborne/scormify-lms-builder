import { SidebarProvider } from "@/components/ui/sidebar";
import { LMSSidebar } from "@/components/LMSSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { CourseCard } from "@/components/CourseCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScormUploader } from "@/components/ScormUploader";

const Index = () => {
  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const handleStartCourse = () => {
    toast.info("Course viewer will be implemented in the next iteration");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <LMSSidebar />
        <main className="flex-1 p-8">
          <DashboardHeader title="Learning Dashboard">
            <ScormUploader />
          </DashboardHeader>
          {isLoading ? (
            <div>Loading courses...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses?.map((course) => (
                <CourseCard
                  key={course.id}
                  title={course.title}
                  description="SCORM Course"
                  onStart={handleStartCourse}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;