import { lazy } from "react";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import { Navigate } from "react-router-dom";

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
    path: "/documents/:id",
    element: <lazy(() => import("@/components/documents/DocumentEditor")).default>,
    protected: true,
  },
  {
    path: "*",
    element: <Navigate to="/index" replace />,
    protected: false,
  }
];

export { routes };