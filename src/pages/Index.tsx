import { SidebarProvider } from "@/components/ui/sidebar";
import { LMSSidebar } from "@/components/LMSSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { CourseCard } from "@/components/CourseCard";
import { toast } from "sonner";

const Index = () => {
  const handleUpload = () => {
    toast.info("SCORM upload functionality will be implemented in the next iteration");
  };

  const handleStartCourse = () => {
    toast.info("Course viewer will be implemented in the next iteration");
  };

  // Sample courses (in the next iteration, these will come from the SCORM files)
  const sampleCourses = [
    {
      title: "Introduction to SCORM",
      description: "Learn the basics of SCORM and how it works in an LMS environment.",
    },
    {
      title: "Advanced Learning Techniques",
      description: "Explore advanced learning methodologies and best practices.",
    },
    {
      title: "Course Creation Guide",
      description: "A comprehensive guide to creating effective online courses.",
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <LMSSidebar />
        <main className="flex-1 p-8">
          <DashboardHeader title="Learning Dashboard" onUpload={handleUpload} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleCourses.map((course) => (
              <CourseCard
                key={course.title}
                title={course.title}
                description={course.description}
                onStart={handleStartCourse}
              />
            ))}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;