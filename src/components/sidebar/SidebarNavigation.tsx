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
    if (path === '/index' && location.pathname === '/index') return true;
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
            className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}