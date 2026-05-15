import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, FolderKanban, MessageSquare, Flag,
  Mail, BarChart3, Settings, ShieldCheck, Sparkles, Award, Layout,
  FileText, Activity, Bell,
} from "lucide-react";
import { useBranding } from "@/lib/branding-store";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const main = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Utilisateurs", url: "/users", icon: Users },
  { title: "Projets", url: "/projects", icon: FolderKanban },
  { title: "Interactions", url: "/interactions", icon: MessageSquare },
  { title: "Signalements", url: "/reports", icon: Flag },
  { title: "Messages", url: "/messages", icon: Mail },
];
const insights = [
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "AI Insights", url: "/ai", icon: Sparkles },
];
const system = [
  { title: "Badges", url: "/badges", icon: Award },
  { title: "Landing & Branding", url: "/landing", icon: Layout },
  { title: "Admins", url: "/admins", icon: ShieldCheck },
  { title: "Logs d'Audit", url: "/audit-logs", icon: FileText },
  { title: "Monitoring", url: "/system-monitoring", icon: Activity },
  { title: "Paramètres", url: "/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const branding = useBranding();
  const isActive = (path: string) => path === "/" ? pathname === "/" : pathname.startsWith(path);

  const renderItem = (item: typeof main[number]) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
        <NavLink to={item.url} end={item.url === "/"} className="group">
          <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
          {!collapsed && <span className="font-medium">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-2.5">
          <div className="relative h-8 w-8 rounded-lg gradient-primary glow flex items-center justify-center shrink-0 overflow-hidden">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.name} className="h-full w-full object-cover" />
            ) : (
              <span className="font-display font-bold text-primary-foreground text-sm">{branding.name.charAt(0).toUpperCase()}</span>
            )}
            <div className="absolute inset-0 rounded-lg bg-primary/30 blur-md -z-10 animate-pulse-glow" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-display font-bold text-sm truncate">{branding.name}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Admin Console</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        <SidebarGroup>
          <SidebarGroupLabel>Plateforme</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{main.map(renderItem)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Insights</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{insights.map(renderItem)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Système</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{system.map(renderItem)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed ? (
          <div className="rounded-lg p-3 bg-gradient-to-br from-primary/15 via-accent/10 to-neon-pink/15 border border-primary/20">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Pro Tier</div>
            <div className="text-xs text-muted-foreground mt-1">Unlock advanced moderation & API.</div>
          </div>
        ) : (
          <div className="h-8 w-8 mx-auto rounded-lg gradient-neon" />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
