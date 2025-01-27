import { useLocation, useNavigate } from "react-router-dom";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { menuItems } from "@/config/menuItems";

export function SidebarNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    // Special case for index route
    if (path === '/index' && location.pathname === '/index') return true;
    // For other routes, check if the pathname starts with the path
    if (path !== '/index' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <SidebarMenu>
      {menuItems.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton 
            onClick={() => navigate(item.path)}
            data-active={isActive(item.path)}
            className="relative data-[active=true]:bg-sidebar-primary/10 data-[active=true]:text-sidebar-primary font-medium transition-colors before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-sidebar-primary before:opacity-0 data-[active=true]:before:opacity-100 before:transition-opacity"
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}