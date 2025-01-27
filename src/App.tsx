import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "./components/ui/sidebar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { routes } from "./routes";
import { Suspense } from "react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Navigate to="/index" replace />} />
              {routes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={
                    <Suspense fallback={<div>Loading...</div>}>
                      {route.protected ? (
                        <ProtectedRoute>{route.element}</ProtectedRoute>
                      ) : (
                        route.element
                      )}
                    </Suspense>
                  }
                />
              ))}
            </Routes>
          </div>
        </SidebarProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;