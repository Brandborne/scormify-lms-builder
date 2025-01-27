import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { BookOpen, Home, Library, Settings, Users, FileText, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function LMSSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };
    getUser();
  }, []);

  const menuItems = [
    { title: "Dashboard", icon: Home, path: "/" },
    { title: "My Courses", icon: BookOpen, path: "/my-courses" },
    { title: "Library", icon: Library, path: "/library" },
    { title: "Contacts", icon: Users, path: "/contacts" },
    { title: "Documents", icon: FileText, path: "/documents" },
    { title: "Settings", icon: Settings, path: "/settings" },
  ];

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Learning Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.path)}
                    data-active={isActive(item.path)}
                    className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        {userEmail && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-sidebar-foreground/70 px-2">
              Signed in as:
              <br />
              <span className="font-medium text-sidebar-foreground">{userEmail}</span>
            </p>
            <SidebarMenuButton 
              onClick={handleSignOut}
              className="w-full justify-start text-destructive hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}