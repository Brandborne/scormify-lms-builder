import { LogOut } from "lucide-react";
import { SidebarFooter, SidebarMenuButton } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface SidebarUserFooterProps {
  userEmail: string | null;
}

export function SidebarUserFooter({ userEmail }: SidebarUserFooterProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  return (
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
  );
}