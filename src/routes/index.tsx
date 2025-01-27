import { lazy } from "react";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";

const routes = [
  {
    path: "/",
    element: <Index />,
    protected: true,
  },
  {
    path: "/auth",
    element: <Auth />,
    protected: false,
  },
  {
    path: "/documents/:id",
    element: lazy(() => import("@/components/documents/DocumentEditor")),
    protected: true,
  },
  {
    path: "/courses",
    element: lazy(() => import("@/pages/Courses")),
    protected: true,
  },
  {
    path: "/courses/:id",
    element: lazy(() => import("@/pages/CourseDetails")),
    protected: true,
  },
  {
    path: "/settings",
    element: lazy(() => import("@/pages/Settings")),
    protected: true,
  },
  {
    path: "/profile",
    element: lazy(() => import("@/pages/Profile")),
    protected: true,
  }
];

export { routes };