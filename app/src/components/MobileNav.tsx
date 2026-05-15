import { Link, useLocation } from "@tanstack/react-router";
import { Home, LayoutDashboard, MessageCircle, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function MobileNav() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const navItems = [
    { to: "/", icon: Home, label: "Accueil" },
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/chat", icon: MessageCircle, label: "Chat" },
    { to: "/settings", icon: Settings, label: "Paramètres" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            (item.to !== "/" && location.pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              params={item.params || {}}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all min-w-0 flex-1"
              activeProps={{
                className: "text-primary",
              }}
            >
              <item.icon
                className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`}
              />
              <span className="text-xs truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
