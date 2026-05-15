import { createFileRoute, Navigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import { Settings, Bell, Shield, Palette, User, Globe, Trash2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { updateUserPreferences } from "@/lib/api";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [{ title: "Paramètres — ProjectLink" }],
  }),
});

function SettingsPage() {
  const { user, loading, token, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load user preferences on mount
  useEffect(() => {
    if (user) {
      setNotifications(user.notifications_enabled ?? true);
      setPublicProfile(user.public_profile ?? true);
    }
  }, [user]);

  const handleNotificationsChange = async (checked: boolean) => {
    setNotifications(checked);
    if (user && token) {
      setSaving(true);
      try {
        await updateUserPreferences({ notifications_enabled: checked }, token);
        toast.success("Préférences de notifications mises à jour");
      } catch (error) {
        toast.error("Erreur lors de la mise à jour");
      } finally {
        setSaving(false);
      }
    }
  };

  const handlePublicProfileChange = async (checked: boolean) => {
    setPublicProfile(checked);
    if (user && token) {
      setSaving(true);
      try {
        await updateUserPreferences({ public_profile: checked }, token);
        toast.success("Paramètre de confidentialité mis à jour");
      } catch (error) {
        toast.error("Erreur lors de la mise à jour");
      } finally {
        setSaving(false);
      }
    }
  };

  if (!loading && !user) {
    return <Navigate to="/auth" />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Paramètres</h1>
          </div>
          <p className="text-muted-foreground">Gérez vos préférences et votre compte</p>
        </motion.div>

        <div className="space-y-6">
          {/* Profil */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profil
            </h2>
            <div className="space-y-4">
              <div>
                <Label>Nom affiché</Label>
                <p className="text-sm text-muted-foreground">
                  {user?.display_name || "Non défini"}
                </p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground">{user?.id}</p>
              </div>
              <div>
                <Label>Nom d'utilisateur</Label>
                <p className="text-sm text-muted-foreground">@{user?.username || "Non défini"}</p>
              </div>
            </div>
          </motion.section>

          {/* Apparence */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Apparence
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <Label>Mode sombre</Label>
                <p className="text-sm text-muted-foreground">
                  Basculer entre le thème clair et sombre
                </p>
              </div>
              <Switch
                key={`${user?.id}-${theme}`}
                checked={theme === "dark"}
                onCheckedChange={toggle}
              />
            </div>
          </motion.section>

          {/* Notifications */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifications par email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des notifications par email
                  </p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={handleNotificationsChange}
                  disabled={saving}
                />
              </div>
            </div>
          </motion.section>

          {/* Confidentialité */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Confidentialité
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Profil public</Label>
                  <p className="text-sm text-muted-foreground">
                    Permettre à d'autres de voir votre profil
                  </p>
                </div>
                <Switch
                  checked={publicProfile}
                  onCheckedChange={handlePublicProfileChange}
                  disabled={saving}
                />
              </div>
            </div>
          </motion.section>

          {/* Langue */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Langue et région
            </h2>
            <div>
              <Label>Langue</Label>
              <p className="text-sm text-muted-foreground">Français</p>
            </div>
          </motion.section>

          {/* Zone dangereuse */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-2xl p-6 border-red-500/20"
          >
            <h2 className="text-xl font-bold mb-4 text-red-500 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Zone dangereuse
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Se déconnecter</Label>
                  <p className="text-sm text-muted-foreground">Déconnecter votre compte</p>
                </div>
                <Button variant="outline" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-red-500">Supprimer le compte</Label>
                  <p className="text-sm text-muted-foreground">
                    Supprimer définitivement votre compte et toutes vos données
                  </p>
                </div>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
