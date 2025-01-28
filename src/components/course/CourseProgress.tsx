import { CourseAssignment } from "../people/types";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface CourseProgressProps {
  assignments?: CourseAssignment[];
}

export function CourseProgress({ assignments = [] }: CourseProgressProps) {
  if (!assignments.length) return null;

  const assignment = assignments[0]; // We only care about the specific course assignment
  const isCompleted = assignment.status === 'completed';
  const isInProgress = assignment.status === 'in_progress';

  const getProgressColor = () => {
    if (isCompleted) return 'bg-green-500';
    if (isInProgress) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const getProgressWidth = () => {
    if (isCompleted) return '100%';
    if (isInProgress) return '50%';
    return '0%';
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getProgressColor()} transition-all`}
              style={{ width: getProgressWidth() }}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'}
          </span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-64">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Course Progress</h4>
          <div className="grid grid-cols-2 gap-1 text-sm">
            <span className="text-muted-foreground">Status:</span>
            <span className={`font-medium ${
              isCompleted ? 'text-green-600' : 
              isInProgress ? 'text-blue-600' : 
              'text-gray-600'
            }`}>
              {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'}
            </span>
            {assignment.completed_at && (
              <>
                <span className="text-muted-foreground">Completed:</span>
                <span className="font-medium">
                  {new Date(assignment.completed_at).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}