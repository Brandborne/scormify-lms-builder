import { SidebarProvider } from "@/components/ui/sidebar";
import { LMSSidebar } from "@/components/LMSSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { CourseCard } from "@/components/CourseCard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScormUploader } from "@/components/ScormUploader";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface CourseStats {
  total_assigned?: string;
  completed?: string;
}

interface CourseWithStats {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  manifest_data: {
    stats?: CourseStats;
  } | null;
}

const Index = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);
  
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      console.log('Fetching courses...');
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching courses:', error);
        throw error;
      }
      
      console.log('Courses fetched:', data);
      return data as CourseWithStats[];
    },
    enabled: !!session
  });

  const handleCourseDelete = () => {
    queryClient.invalidateQueries({ queryKey: ['courses'] });
  };

  if (!session) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <LMSSidebar />
        <main className="flex-1 p-8">
          <DashboardHeader title="Learning Dashboard">
            <ScormUploader />
          </DashboardHeader>
          {error && (
            <div className="text-red-500">Error loading courses: {error.message}</div>
          )}
          {isLoading ? (
            <div>Loading courses...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses?.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description || "SCORM Course"}
                  createdAt={course.created_at}
                  onDelete={handleCourseDelete}
                  stats={course.manifest_data?.stats}
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