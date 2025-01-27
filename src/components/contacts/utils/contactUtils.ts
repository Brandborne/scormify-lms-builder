import { Contact, CourseAssignment } from "../types";

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-green-600';
    case 'in_progress':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};