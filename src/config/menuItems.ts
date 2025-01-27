import { Home, BookOpen, Library, Users, FileText, Settings } from "lucide-react";

export const menuItems = [
  { title: "Dashboard", icon: Home, path: "/index" },
  { title: "My Courses", icon: BookOpen, path: "/index" }, // Will update when my-courses route is added
  { title: "Library", icon: Library, path: "/index" }, // Will update when library route is added
  { title: "Contacts", icon: Users, path: "/index" }, // Will update when contacts route is added
  { title: "Documents", icon: FileText, path: "/documents/new" },
  { title: "Settings", icon: Settings, path: "/index" }, // Will update when settings route is added
];