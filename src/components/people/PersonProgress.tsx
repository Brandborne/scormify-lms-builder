import { CourseAssignment } from "./types";
import { Button } from "@/components/ui/button";
import { ListFilter } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface ContactProgressProps {
  assignments?: CourseAssignment[];
  onOpenDetails: () => void;
  showCourseProgress?: boolean;
}

export function ContactProgress({ 
  assignments = [], 
  onOpenDetails,
  showCourseProgress = false
}: ContactProgressProps) {
  if (showCourseProgress && assignments.length > 0) {
    const assignment = assignments[0];
    const getProgressColor = () => {
      if (assignment.status === 'completed') return 'bg-green-500';
      if (assignment.status === 'in_progress') return 'bg-blue-500';
      return 'bg-gray-400';
    };

    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getProgressColor()} transition-all`}
                style={{ 
                  width: assignment.status === 'completed' ? '100%' : 
                         assignment.status === 'in_progress' ? '50%' : '0%'
                }}
              />
            </div>
            <span className="text-sm text-muted-foreground capitalize">
              {assignment.status.replace('_', ' ')}
            </span>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-64">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Course Progress</h4>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium capitalize">{assignment.status.replace('_', ' ')}</span>
              {assignment.completed_at && (
                <>
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="font-medium">{new Date(assignment.completed_at).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  const totalCourses = assignments.length;
  const completedCourses = assignments.filter(a => a.status === 'completed').length;
  const inProgressCourses = assignments.filter(a => a.status === 'in_progress').length;

  const getProgressColor = () => {
    if (totalCourses === 0) return 'bg-gray-200';
    if (completedCourses === totalCourses) return 'bg-green-500';
    if (completedCourses > 0 || inProgressCourses > 0) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  if (totalCourses === 0) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onOpenDetails}
      >
        <ListFilter className="h-4 w-4 mr-2" />
        Assign Course
      </Button>
    );
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getProgressColor()} transition-all`}
              style={{ 
                width: `${(completedCourses / totalCourses) * 100}%`
              }}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenDetails}
          >
            <ListFilter className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {completedCourses}/{totalCourses}
          </span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-64">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Course Progress</h4>
          <div className="grid grid-cols-2 gap-1 text-sm">
            <span className="text-muted-foreground">Total Courses:</span>
            <span className="font-medium">{totalCourses}</span>
            <span className="text-muted-foreground">Completed:</span>
            <span className="text-green-600 font-medium">{completedCourses}</span>
            <span className="text-muted-foreground">In Progress:</span>
            <span className="text-blue-600 font-medium">{inProgressCourses}</span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}