export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
}

export interface CourseAssignment {
  course_title: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_at: string;
  completed_at: string | null;
  course_id: string;
  contact_id: string;
}

export interface ContactWithAssignments extends Contact {
  assignments?: CourseAssignment[];
}

export interface ContactListProps {
  courseId?: string;
  onToggleAssignment?: (contactId: string) => void;
  onContactDeleted: () => void;
}

export interface ContactRowProps {
  contact: ContactWithAssignments;
  isAssigned?: boolean;
  onToggleAssignment?: (contactId: string) => void;
  onContactDeleted: () => void;
}

export interface ContactActionsProps {
  contactId: string;
  onDelete: () => void;
  onEdit: () => void;
}

export interface EditableFieldProps {
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
}

export interface ContactProgressProps {
  assignments?: CourseAssignment[];
  onOpenDetails: () => void;
}

export interface ContactEditorProps {
  contact: Contact;
  onSave: () => void;
  onCancel: () => void;
}
