import { lazy } from "react";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import { Navigate } from "react-router-dom";
import { MyCoursesView } from "@/components/MyCoursesView";
import { LibraryView } from "@/components/LibraryView";
import { PeopleView } from "@/components/PeopleView";
import { DocumentsView } from "@/components/DocumentsView";
import { SettingsView } from "@/components/SettingsView";
import { CourseViewer } from "@/components/CourseViewer";

const DocumentEditor = lazy(() => import("@/components/documents/DocumentEditor"));

const routes = [
  {
    path: "/index",
    element: <Index />,
    protected: true,
  },
  {
    path: "/auth",
    element: <Auth />,
    protected: false,
  },
  {
    path: "/my-courses",
    element: <MyCoursesView />,
    protected: true,
  },
  {
    path: "/library",
    element: <LibraryView />,
    protected: true,
  },
  {
    path: "/people",
    element: <PeopleView />,
    protected: true,
  },
  {
    path: "/documents",
    element: <DocumentsView />,
    protected: true,
  },
  {
    path: "/documents/:id",
    element: <DocumentEditor />,
    protected: true,
  },
  {
    path: "/settings",
    element: <SettingsView />,
    protected: true,
  },
  {
    path: "/courses/:courseId",
    element: <CourseViewer />,
    protected: true,
  },
  {
    path: "/contacts",
    element: <Navigate to="/people" replace />,
    protected: false,
  },
  {
    path: "*",
    element: <Navigate to="/index" replace />,
    protected: false,
  }
];

export { routes };
