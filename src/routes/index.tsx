import { Navigate } from "react-router-dom";
import { CourseViewer } from "@/components/CourseViewer";
import { LibraryView } from "@/components/LibraryView";
import { ContactsView } from "@/components/ContactsView";
import { DocumentsView } from "@/components/DocumentsView";
import { MyCoursesView } from "@/components/MyCoursesView";
import { SettingsView } from "@/components/SettingsView";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";

export const routes = [
  {
    path: "/",
    element: <Index />,
    protected: true,
  },
  {
    path: "/my-courses",
    element: <MyCoursesView />,
    protected: true,
  },
  {
    path: "/courses/:courseId",
    element: <CourseViewer />,
    protected: true,
  },
  {
    path: "/library",
    element: <LibraryView />,
    protected: true,
  },
  {
    path: "/contacts",
    element: <ContactsView />,
    protected: true,
  },
  {
    path: "/documents",
    element: <DocumentsView />,
    protected: true,
  },
  {
    path: "/settings",
    element: <SettingsView />,
    protected: true,
  },
  {
    path: "/auth",
    element: <Auth />,
    protected: false,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
    protected: false,
  },
];