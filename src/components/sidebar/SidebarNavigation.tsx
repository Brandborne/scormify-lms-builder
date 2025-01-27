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
    // Handle root path
    if (path === '/index' && (location.pathname === '/index' || location.pathname === '/')) {
      return true;
    }
    // For other routes, check exact match or if it's a sub-route
    return path !== '/index' && (
      location.pathname === path || 
      (location.pathname.startsWith(path) && location.pathname.charAt(path.length) === '/')
    );
  };

  return (
    <SidebarMenu>
      {menuItems.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton 
            onClick={() => navigate(item.path)}
            data-active={isActive(item.path)}
            className="relative flex items-center w-full gap-2 px-2 py-2 text-sm transition-colors rounded-md outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 data-[active=true]:bg-sidebar-accent/10 data-[active=true]:text-sidebar-primary data-[active=true]:font-medium before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-sidebar-primary before:opacity-0 data-[active=true]:before:opacity-100 before:transition-opacity"
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}