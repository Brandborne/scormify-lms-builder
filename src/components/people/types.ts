export interface Person {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  created_at: string;
  created_by: string;
}

export interface CourseAssignment {
  course_title: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_at: string;
  completed_at: string | null;
  course_id: string;
  person_id: string;
}

export interface PersonWithAssignments extends Person {
  assignments?: CourseAssignment[];
}

export interface PersonListProps {
  courseId?: string;
  onToggleAssignment?: (personId: string) => void;
  onPersonDeleted: () => void;
}

export interface PersonRowProps {
  person: PersonWithAssignments;
  isAssigned?: boolean;
  onToggleAssignment?: (personId: string) => void;
  onPersonDeleted: () => void;
  onRemoveFromCourse?: (personId: string) => void;
}

export interface PersonActionsProps {
  personId: string;
  onEdit: () => void;
}

export interface PersonProgressProps {
  assignments?: CourseAssignment[];
  onOpenDetails: () => void;
}

export interface PersonEditorProps {
  person: Person;
  onSave: () => void;
  onCancel: () => void;
}