import { PageHeader } from "@/components/admin/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  EyeOff,
  Copy,
  Save,
  RefreshCw,
  RotateCcw,
  Shield,
  Globe,
  Database,
  Mail,
  Bell,
  Users,
  Settings as SettingsIcon,
  Key,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  useSettings,
  useUpdateSettings,
  useGenerateApiKey,
  useTestEmailConfig,
  useResetSettings,
  type PlatformSettings,
} from "@/hooks/useSettings";

function Section({ title, desc, children }: unknown) {
  return (
    <div className="rounded-xl border border-border bg-card card-shadow p-6">
      <h3 className="font-display font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 mb-4">{desc}</p>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export default function Settings() {
  const [showKey, setShowKey] = useState(false);
  const [localSettings, setLocalSettings] = useState<PlatformSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Hooks pour la gestion des paramètres
  const { data: settings, isLoading, error } = useSettings();
  const updateMutation = useUpdateSettings();
  const generateApiKeyMutation = useGenerateApiKey();
  const testEmailMutation = useTestEmailConfig();
  const resetMutation = useResetSettings();

  // Utiliser les paramètres locaux ou ceux du serveur
  const currentSettings = localSettings || settings;

  // Initialiser les paramètres locaux quand les données arrivent
  useEffect(() => {
    if (settings && !localSettings) {
      setLocalSettings(settings);
    }
  }, [settings, localSettings]);

  const updateSetting = (category: string, key: string, value: unknown) => {
    if (!localSettings) return;

    setLocalSettings((prev) => {
      if (!prev) return prev;
      const newSettings = { ...prev };
      const categorySettings = newSettings[category as keyof PlatformSettings] as Record<
        string,
        unknown
      >;
      categorySettings[key] = value;
      return newSettings;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localSettings) return;

    try {
      await updateMutation.mutateAsync(localSettings);
      setHasChanges(false);
      toast.success("Paramètres sauvegardés avec succès");
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const generateNewApiKey = async () => {
    try {
      const result = await generateApiKeyMutation.mutateAsync();
      if (localSettings) {
        setLocalSettings((prev) =>
          prev
            ? {
                ...prev,
                api: {
                  ...prev.api,
                  key: result.apiKey,
                },
              }
            : prev,
        );
        setHasChanges(true);
      }
    } catch (error) {
      console.error('Erreur lors de la génération de la clé API:', error);
    }
  };

  const testEmailConfig = async () => {
    if (!currentSettings?.email) return;

    try {
      await testEmailMutation.mutateAsync(currentSettings.email);
    } catch (error) {
      console.error('Erreur lors du test email:', error);
    }
  };

  const handleReset = async () => {
    try {
      const result = await resetMutation.mutateAsync();
      setLocalSettings(result.settings);
      setHasChanges(false);
      toast.success("Paramètres réinitialisés");
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4">
            Impossible de charger les paramètres: {error.message}
          </p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (!currentSettings) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Configuration globale de la plateforme"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={resetMutation.isPending}
              className="text-red-600 hover:text-red-700"
            >
              {resetMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Réinitialiser
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
              className={hasChanges ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {updateMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {hasChanges ? "Sauvegarder" : "Sauvegardé"}
            </Button>
          </div>
        }
      />

      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Vous avez des modifications non sauvegardées
              </span>
            </div>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {updateMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Sauvegarder maintenant
            </Button>
          </div>
        </motion.div>
      )}

      <Tabs defaultValue="platform" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="platform" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Plateforme
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API
          </TabsTrigger>
          <TabsTrigger value="limits" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Limites
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Identité de la Plateforme
              </CardTitle>
              <CardDescription>
                Configurez l'apparence et les informations publiques de votre plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="platformName">Nom de la plateforme</Label>
                  <Input
                    id="platformName"
                    value={currentSettings.platform.name}
                    onChange={(e) => updateSetting("platform", "name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="platformUrl">URL principale</Label>
                  <Input
                    id="platformUrl"
                    value={currentSettings.platform.url}
                    onChange={(e) => updateSetting("platform", "url", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="platformDescription">Description</Label>
                <Textarea
                  id="platformDescription"
                  value={currentSettings.platform.description}
                  onChange={(e) => updateSetting("platform", "description", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="theme">Thème par défaut</Label>
                  <Select
                    value={currentSettings.platform.theme}
                    onValueChange={(value) => updateSetting("platform", "theme", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Clair</SelectItem>
                      <SelectItem value="dark">Sombre</SelectItem>
                      <SelectItem value="auto">Automatique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Langue par défaut</Label>
                  <Select
                    value={currentSettings.platform.language}
                    onValueChange={(value) => updateSetting("platform", "language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Paramètres de Sécurité
              </CardTitle>
              <CardDescription>
                Configurez les politiques de sécurité et d'authentification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <ToggleCard
                  label="2FA obligatoire pour les administrateurs"
                  description="Exiger l'authentification à deux facteurs pour tous les comptes admin"
                  checked={currentSettings.security.twoFactorRequired}
                  onCheckedChange={(checked) =>
                    updateSetting("security", "twoFactorRequired", checked)
                  }
                />
                <ToggleCard
                  label="Vérification email obligatoire"
                  description="Les nouveaux utilisateurs doivent vérifier leur email"
                  checked={currentSettings.security.emailVerification}
                  onCheckedChange={(checked) =>
                    updateSetting("security", "emailVerification", checked)
                  }
                />
                <ToggleCard
                  label="Bloquer les emails jetables"
                  description="Empêcher l'inscription avec des domaines d'email temporaires"
                  checked={currentSettings.security.blockDisposableEmails}
                  onCheckedChange={(checked) =>
                    updateSetting("security", "blockDisposableEmails", checked)
                  }
                />
                <ToggleCard
                  label="Logs d'activité administrateur"
                  description="Enregistrer toutes les actions des administrateurs"
                  checked={currentSettings.security.adminActivityLogs}
                  onCheckedChange={(checked) =>
                    updateSetting("security", "adminActivityLogs", checked)
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <Label htmlFor="sessionTimeout">Timeout session (heures)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={currentSettings.security.sessionTimeout}
                    onChange={(e) =>
                      updateSetting("security", "sessionTimeout", parseInt(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="maxLoginAttempts">Tentatives de connexion max</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={currentSettings.security.maxLoginAttempts}
                    onChange={(e) =>
                      updateSetting("security", "maxLoginAttempts", parseInt(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="passwordMinLength">Longueur mot de passe min</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={currentSettings.security.passwordMinLength}
                    onChange={(e) =>
                      updateSetting("security", "passwordMinLength", parseInt(e.target.value))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Configuration API
              </CardTitle>
              <CardDescription>Gérez les clés API et les paramètres d'accès</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="apiKey">Clé API principale</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="apiKey"
                    value={showKey ? currentSettings.api.key : "•".repeat(32)}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(currentSettings.api.key);
                      toast.success("Clé API copiée");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={generateNewApiKey}
                    className="text-red-600 hover:text-red-700"
                    disabled={generateApiKeyMutation.isPending}
                  >
                    {generateApiKeyMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      "Régénérer"
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                  <Badge variant="outline">Production</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rateLimit">Limite de requêtes/heure</Label>
                  <Input
                    id="rateLimit"
                    type="number"
                    value={currentSettings.api.rateLimit}
                    onChange={(e) => updateSetting("api", "rateLimit", parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="webhookSecret">Secret webhook</Label>
                  <Input
                    id="webhookSecret"
                    value={currentSettings.api.webhookSecret}
                    onChange={(e) => updateSetting("api", "webhookSecret", e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <ToggleCard
                label="Activer CORS"
                description="Autoriser les requêtes cross-origin"
                checked={currentSettings.api.enableCors}
                onCheckedChange={(checked) => updateSetting("api", "enableCors", checked)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Limites Utilisateurs
              </CardTitle>
              <CardDescription>
                Définissez les quotas et restrictions pour les utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="maxProjects">Projets max par utilisateur</Label>
                  <Input
                    id="maxProjects"
                    type="number"
                    value={currentSettings.limits.maxProjectsPerUser}
                    onChange={(e) =>
                      updateSetting("limits", "maxProjectsPerUser", parseInt(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="maxComments">Commentaires par minute</Label>
                  <Input
                    id="maxComments"
                    type="number"
                    value={currentSettings.limits.maxCommentsPerMinute}
                    onChange={(e) =>
                      updateSetting("limits", "maxCommentsPerMinute", parseInt(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="maxUpload">Taille upload max (MB)</Label>
                  <Input
                    id="maxUpload"
                    type="number"
                    value={currentSettings.limits.maxUploadSizeMB}
                    onChange={(e) =>
                      updateSetting("limits", "maxUploadSizeMB", parseInt(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="maxTeamMembers">Membres équipe max</Label>
                  <Input
                    id="maxTeamMembers"
                    type="number"
                    value={currentSettings.limits.maxTeamMembers}
                    onChange={(e) =>
                      updateSetting("limits", "maxTeamMembers", parseInt(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="maxSkills">Compétences max par utilisateur</Label>
                  <Input
                    id="maxSkills"
                    type="number"
                    value={currentSettings.limits.maxSkillsPerUser}
                    onChange={(e) =>
                      updateSetting("limits", "maxSkillsPerUser", parseInt(e.target.value))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configuration Email
              </CardTitle>
              <CardDescription>Paramètres SMTP pour l'envoi d'emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpHost">Serveur SMTP</Label>
                  <Input
                    id="smtpHost"
                    value={currentSettings.email.smtpHost}
                    onChange={(e) => updateSetting("email", "smtpHost", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPort">Port SMTP</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={currentSettings.email.smtpPort}
                    onChange={(e) => updateSetting("email", "smtpPort", parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="smtpUser">Utilisateur SMTP</Label>
                  <Input
                    id="smtpUser"
                    value={currentSettings.email.smtpUser}
                    onChange={(e) => updateSetting("email", "smtpUser", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPassword">Mot de passe SMTP</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={currentSettings.email.smtpPassword}
                    onChange={(e) => updateSetting("email", "smtpPassword", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="fromEmail">Email expéditeur</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={currentSettings.email.fromEmail}
                    onChange={(e) => updateSetting("email", "fromEmail", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="fromName">Nom expéditeur</Label>
                  <Input
                    id="fromName"
                    value={currentSettings.email.fromName}
                    onChange={(e) => updateSetting("email", "fromName", e.target.value)}
                  />
                </div>
              </div>
              <div className="pt-4 border-t">
                <Button
                  onClick={testEmailConfig}
                  variant="outline"
                  disabled={testEmailMutation.isPending}
                >
                  {testEmailMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  {testEmailMutation.isPending ? "Test en cours..." : "Tester la configuration"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configurez les notifications automatiques</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <ToggleCard
                  label="Notifications par email"
                  description="Envoyer des notifications par email"
                  checked={currentSettings.notifications.enableEmailNotifications}
                  onCheckedChange={(checked) =>
                    updateSetting("notifications", "enableEmailNotifications", checked)
                  }
                />
                <ToggleCard
                  label="Notifications push"
                  description="Envoyer des notifications push (nécessite un service)"
                  checked={currentSettings.notifications.enablePushNotifications}
                  onCheckedChange={(checked) =>
                    updateSetting("notifications", "enablePushNotifications", checked)
                  }
                />
                <ToggleCard
                  label="Intégration Slack"
                  description="Envoyer des notifications vers Slack"
                  checked={currentSettings.notifications.enableSlackIntegration}
                  onCheckedChange={(checked) =>
                    updateSetting("notifications", "enableSlackIntegration", checked)
                  }
                />
              </div>

              {currentSettings.notifications.enableSlackIntegration && (
                <div>
                  <Label htmlFor="slackWebhook">Webhook Slack</Label>
                  <Input
                    id="slackWebhook"
                    value={currentSettings.notifications.slackWebhook}
                    onChange={(e) => updateSetting("notifications", "slackWebhook", e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>
              )}

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Événements à notifier</h4>
                <div className="space-y-3">
                  <ToggleCard
                    label="Nouvel utilisateur"
                    description="Notifier lors de l'inscription d'un nouvel utilisateur"
                    checked={currentSettings.notifications.notifyOnNewUser}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "notifyOnNewUser", checked)
                    }
                  />
                  <ToggleCard
                    label="Nouveau projet"
                    description="Notifier lors de la création d'un nouveau projet"
                    checked={currentSettings.notifications.notifyOnNewProject}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "notifyOnNewProject", checked)
                    }
                  />
                  <ToggleCard
                    label="Erreurs système"
                    description="Notifier lors d'erreurs critiques"
                    checked={currentSettings.notifications.notifyOnError}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "notifyOnError", checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ToggleCard({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
      <div className="space-y-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}