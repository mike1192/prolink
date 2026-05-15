import { Bell, Search, Download, Command, LogOut, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { CommandPalette } from "./CommandPalette";
import { useBranding } from "@/lib/branding-store";
import { exportRowsAsCSV } from "@/lib/csv";
import { users as mockUsers, projects as mockProjects } from "@/lib/mock-data";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

export function Topbar() {
  const [open, setOpen] = useState(false);
  const name = useBranding((s) => s.name);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success("Déconnexion réussie");
  };
  return (
    <header className="h-14 border-b border-border/60 backdrop-blur-xl bg-background/80 sticky top-0 z-30 flex items-center px-4 gap-3">
      <SidebarTrigger className="hover:bg-accent/50" />
      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
        <button
          onClick={() => setOpen(true)}
          className="group flex items-center w-full gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition text-sm text-muted-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Rechercher dans {name}…</span>
          <kbd className="ml-auto flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </button>
      </div>
      <div className="flex-1 md:flex-none" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              exportRowsAsCSV(`users-${new Date().toISOString().slice(0, 10)}.csv`, mockUsers, [
                "id","name","email","role","status","verified","projects","joined","badges",
              ]);
              toast.success(`${mockUsers.length} utilisateurs exportés`);
            }}
          >
            Utilisateurs (CSV)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              exportRowsAsCSV(`projects-${new Date().toISOString().slice(0, 10)}.csv`, mockProjects, [
                "id","title","author","category","status","likes","comments","featured","verified","createdAt",
              ]);
              toast.success(`${mockProjects.length} projets exportés`);
            }}
          >
            Projets (CSV)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ThemeToggle />
      <NotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
            <Avatar className="h-8 w-8 border border-primary/30">
              <AvatarFallback className="text-[11px] font-semibold gradient-primary text-primary-foreground">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'SA'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name || 'Super Admin'}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profil</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Se déconnecter</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </header>
  );
}
