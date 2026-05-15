import { useEffect } from "react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, FolderKanban, Flag, BarChart3, Settings, Sparkles, Mail, MessageSquare, ShieldCheck, Award, Layout, Download } from "lucide-react";
import { exportRowsAsCSV } from "@/lib/csv";
import { users as mockUsers, projects as mockProjects } from "@/lib/mock-data";
import { toast } from "sonner";

const items = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Utilisateurs", to: "/users", icon: Users },
  { label: "Projets", to: "/projects", icon: FolderKanban },
  { label: "Interactions", to: "/interactions", icon: MessageSquare },
  { label: "Signalements", to: "/reports", icon: Flag },
  { label: "Messages", to: "/messages", icon: Mail },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "AI Insights", to: "/ai", icon: Sparkles },
  { label: "Badges", to: "/badges", icon: Award },
  { label: "Landing & Branding", to: "/landing", icon: Layout },
  { label: "Admins", to: "/admins", icon: ShieldCheck },
  { label: "Paramètres", to: "/settings", icon: Settings },
];

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const exportUsers = () => {
    exportRowsAsCSV(`users-${new Date().toISOString().slice(0, 10)}.csv`, mockUsers, [
      "id", "name", "email", "role", "status", "verified", "projects", "joined", "badges",
    ]);
    toast.success(`${mockUsers.length} utilisateurs exportés`);
    onOpenChange(false);
  };

  const exportProjects = () => {
    exportRowsAsCSV(`projects-${new Date().toISOString().slice(0, 10)}.csv`, mockProjects, [
      "id", "title", "author", "category", "status", "likes", "comments", "featured", "verified", "createdAt",
    ]);
    toast.success(`${mockProjects.length} projets exportés`);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Naviguer ou rechercher…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {items.map((it) => (
            <CommandItem key={it.to} onSelect={() => { navigate(it.to); onOpenChange(false); }}>
              <it.icon className="mr-2 h-4 w-4" /> {it.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={exportUsers}>
            <Download className="mr-2 h-4 w-4" /> Exporter CSV utilisateurs
          </CommandItem>
          <CommandItem onSelect={exportProjects}>
            <Download className="mr-2 h-4 w-4" /> Exporter CSV projets
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/admins"); onOpenChange(false); }}>
            <ShieldCheck className="mr-2 h-4 w-4" /> Inviter un admin
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
