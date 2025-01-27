import { lazy } from "react";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import { Navigate } from "react-router-dom";
import { MyCoursesView } from "@/components/MyCoursesView";
import { LibraryView } from "@/components/LibraryView";
import { ContactsView } from "@/components/ContactsView";
import { DocumentsView } from "@/components/DocumentsView";
import { SettingsView } from "@/components/SettingsView";

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
    path: "*",
    element: <Navigate to="/index" replace />,
    protected: false,
  }
];

export { routes };