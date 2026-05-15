import { Link, useLocation } from "@tanstack/react-router";
import {
  Sparkles,
  LogOut,
  User as UserIcon,
  Home,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { AvatarBadge } from "./AvatarBadge";
import { useEffect, useState } from "react";
import {
  fetchProfileById,
  fetchNotifications,
  fetchUnreadMessageCount,
  type Profile,
} from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, openLogin, signOut, token } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const location = useLocation();

  // Fetch unread notifications count
  const { data: notifData } = useQuery({
    queryKey: ["notifications-count"],
    queryFn: () =>
      token
        ? fetchNotifications(token, 1, 1, true)
        : { notifications: [], total: 0, unread_count: 0, page: 1, limit: 1 },
    enabled: !!token,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch unread messages count
  const { data: unreadMessages } = useQuery({
    queryKey: ["unread-messages-count"],
    queryFn: () => (token ? fetchUnreadMessageCount(token) : { unread_count: 0 }),
    enabled: !!token,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const totalUnread = (notifData?.unread_count || 0) + (unreadMessages?.unread_count || 0);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    fetchProfileById(user.id)
      .then(setProfile)
      .catch(() => {});
  }, [user]);

  const navItems = user
    ? [
        { to: "/", icon: Home, label: "Accueil" },
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/chat", icon: MessageCircle, label: "Chat" },
        { to: "/settings", icon: Settings, label: "Paramètres" },
      ]
    : [];

  const mobileNavItems =
    user && profile
      ? [
          { to: "/", icon: Home, label: "Accueil" },
          { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
          { to: "/chat", icon: MessageCircle, label: "Chat" },
          {
            to: "/u/$username",
            icon: UserIcon,
            label: "Profil",
            params: { username: profile.username },
          },
        ]
      : [];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="gradient-bg-primary flex h-9 w-9 items-center justify-center rounded-xl glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight hidden sm:inline">
            Project<span className="gradient-text">Link</span>
          </span>
        </Link>

        {/* Navigation centrale */}
        {user && (
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.to ||
                (item.to !== "/" && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:bg-accent group"
                  activeProps={{
                    className: "bg-primary/10 text-primary font-medium",
                  }}
                >
                  <item.icon
                    className={`h-5 w-5 transition-colors ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user && (
            <Link to="/notifications" className="relative">
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {totalUnread > 0 && (
                  <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </div>
                )}
              </Button>
            </Link>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full ring-2 ring-transparent transition-all hover:ring-primary/50 focus:outline-none">
                <AvatarBadge
                  name={profile?.display_name || profile?.username}
                  url={profile?.avatar_url}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass">
                {profile?.username && (
                  <DropdownMenuItem asChild>
                    <Link
                      to="/u/$username"
                      params={{ username: profile.username }}
                      className="cursor-pointer"
                    >
                      <UserIcon className="mr-2 h-4 w-4" />
                      Mon profil
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="hero" onClick={openLogin}>
              Se connecter
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
