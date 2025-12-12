import { ReactNode, useEffect, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { Navbar } from "./Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AppLayoutProps {
  children: ReactNode;
}

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          displayName={profile?.display_name || undefined}
          avatarUrl={profile?.avatar_url || undefined}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
