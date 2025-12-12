import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Activity,
  Settings,
  History,
  Sliders,
  BarChart3,
  Bell,
  BookOpen,
  Store,
  Brain,
  Users,
  Server,
  ChevronLeft,
  ChevronRight,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: TrendingUp, label: "Strategies", path: "/strategies" },
  { icon: Briefcase, label: "Positions", path: "/positions" },
  { icon: Activity, label: "Activity Log", path: "/activity" },
  { icon: Link2, label: "Brokers", path: "/brokers" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const advancedItems = [
  { icon: History, label: "Backtesting", path: "/backtesting" },
  { icon: Sliders, label: "Optimization", path: "/optimization" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: BookOpen, label: "Trade Journal", path: "/journal" },
];

const eliteItems = [
  { icon: Store, label: "Marketplace", path: "/marketplace" },
  { icon: Brain, label: "AI Insights", path: "/ai-insights" },
  { icon: Users, label: "Team", path: "/team" },
  { icon: Server, label: "Deployment", path: "/deployment" },
];

export const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const NavItem = ({ icon: Icon, label, path }: { icon: any; label: string; path: string }) => {
    const isActive = location.pathname === path;
    return (
      <NavLink
        to={path}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
          "hover:bg-secondary/80 group",
          isActive && "bg-primary/10 text-primary border border-primary/20",
          !isActive && "text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
        {!collapsed && (
          <span className="text-sm font-medium truncate">{label}</span>
        )}
        {isActive && !collapsed && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
        )}
      </NavLink>
    );
  };

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    !collapsed ? (
      <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {children}
      </p>
    ) : <div className="h-px bg-border mx-3 my-2" />
  );

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg">TradeBot</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        <SectionLabel>Core</SectionLabel>
        {navItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}

        <SectionLabel>Advanced</SectionLabel>
        {advancedItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}

        <SectionLabel>Elite</SectionLabel>
        {eliteItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">TB</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Demo Account</p>
              <p className="text-xs text-muted-foreground">v1.0.0</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
