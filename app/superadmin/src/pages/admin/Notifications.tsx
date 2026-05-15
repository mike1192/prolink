import { useState, useEffect } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Bell, 
  BellRing, 
  Check, 
  X, 
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  User,
  Settings,
  Trash2,
  Mail,
  Filter,
  RefreshCw,
  Volume2,
  VolumeX
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'security';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: string;
  action_url?: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  sound_notifications: boolean;
  desktop_notifications: boolean;
  security_alerts: boolean;
  user_reports: boolean;
  system_updates: boolean;
  new_registrations: boolean;
  project_submissions: boolean;
  error_alerts: boolean;
}

// Données simulées pour les notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'security',
    title: 'Tentative de connexion suspecte',
    message: 'Plusieurs tentatives de connexion échouées détectées depuis l\'IP 192.168.1.100',
    timestamp: '2024-01-15T14:30:00Z',
    read: false,
    priority: 'urgent',
    source: 'Système de sécurité',
    action_url: '/security-logs'
  },
  {
    id: '2',
    type: 'warning',
    title: 'Utilisation élevée du serveur',
    message: 'L\'utilisation CPU a dépassé 85% pendant plus de 10 minutes',
    timestamp: '2024-01-15T14:15:00Z',
    read: false,
    priority: 'high',
    source: 'Monitoring système',
    action_url: '/system-monitoring'
  },
  {
    id: '3',
    type: 'info',
    title: 'Nouveau projet soumis',
    message: 'Un nouveau projet "App Mobile E-commerce" a été soumis par Marie Dubois',
    timestamp: '2024-01-15T13:45:00Z',
    read: true,
    priority: 'medium',
    source: 'Plateforme',
    user: {
      id: 'user1',
      name: 'Marie Dubois',
      avatar: '/avatars/marie.jpg'
    },
    action_url: '/projects'
  },
  {
    id: '4',
    type: 'error',
    title: 'Erreur de base de données',
    message: 'Connexion à la base de données interrompue pendant 2 minutes',
    timestamp: '2024-01-15T13:30:00Z',
    read: true,
    priority: 'high',
    source: 'Base de données',
    action_url: '/system-monitoring'
  },
  {
    id: '5',
    type: 'success',
    title: 'Sauvegarde terminée',
    message: 'Sauvegarde automatique quotidienne terminée avec succès (2.3 GB)',
    timestamp: '2024-01-15T12:00:00Z',
    read: true,
    priority: 'low',
    source: 'Système de sauvegarde'
  },
  {
    id: '6',
    type: 'warning',
    title: 'Contenu signalé',
    message: '3 nouveaux signalements reçus pour des commentaires inappropriés',
    timestamp: '2024-01-15T11:30:00Z',
    read: false,
    priority: 'medium',
    source: 'Modération',
    action_url: '/reports'
  }
];

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    sound_notifications: false,
    desktop_notifications: true,
    security_alerts: true,
    user_reports: true,
    system_updates: true,
    new_registrations: false,
    project_submissions: true,
    error_alerts: true
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent' && !n.read).length;

  // Simulation de nouvelles notifications en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      // Simuler une nouvelle notification de temps en temps
      if (Math.random() < 0.1) { // 10% de chance toutes les 10 secondes
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: ['info', 'warning', 'success'][Math.floor(Math.random() * 3)] as unknown,
          title: 'Nouvelle notification',
          message: 'Ceci est une notification de test générée automatiquement',
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'medium',
          source: 'Système de test'
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        
        // Notification sonore si activée
        if (settings.sound_notifications) {
          // Jouer un son (simulation)
          console.log('🔔 Nouvelle notification reçue');
        }
        
        // Notification desktop si activée
        if (settings.desktop_notifications && 'Notification' in window) {
          new Notification(newNotification.title, {
            body: newNotification.message,
            icon: '/favicon.ico'
          });
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [settings.sound_notifications, settings.desktop_notifications]);

  // Demander la permission pour les notifications desktop
  useEffect(() => {
    if (settings.desktop_notifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [settings.desktop_notifications]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAsUnread = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: false } : n)
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success('Notification supprimée');
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('Toutes les notifications marquées comme lues');
  };

  const clearAll = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les notifications ?')) {
      setNotifications([]);
      toast.success('Toutes les notifications supprimées');
    }
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'security':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Élevé</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Moyen</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Faible</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)} jour(s)`;
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'urgent':
        return notification.priority === 'urgent';
      default:
        return true;
    }
  });

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success('Paramètres mis à jour');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centre de Notifications"
        subtitle="Gérez vos alertes et paramètres de notification"
        actions={
          <div className="flex gap-2">
            <Button onClick={markAllAsRead} variant="outline" size="sm" disabled={unreadCount === 0}>
              <Check className="h-4 w-4 mr-2" />
              Tout marquer lu
            </Button>
            <Button onClick={clearAll} variant="outline" size="sm" disabled={notifications.length === 0}>
              <Trash2 className="h-4 w-4 mr-2" />
              Tout supprimer
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        }
      />

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Bell className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
              <p className="text-xs text-muted-foreground">Notifications</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Non lues</CardTitle>
              <BellRing className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
              <p className="text-xs text-muted-foreground">À traiter</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{urgentCount}</div>
              <p className="text-xs text-muted-foreground">Priorité haute</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notifications.filter(n => {
                  const today = new Date().toDateString();
                  const notifDate = new Date(n.timestamp).toDateString();
                  return today === notifDate;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">Reçues</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          {/* Filtres */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Button 
                  variant={filter === 'all' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  Toutes ({notifications.length})
                </Button>
                <Button 
                  variant={filter === 'unread' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Non lues ({unreadCount})
                </Button>
                <Button 
                  variant={filter === 'urgent' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('urgent')}
                >
                  Urgentes ({urgentCount})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Liste des notifications */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                <AnimatePresence>
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 hover:bg-muted/50 transition-colors group ${
                        !notification.read ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {getTypeIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            {getPriorityBadge(notification.priority)}
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                            <span>{notification.source}</span>
                            {notification.user && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {notification.user.name}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.read ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              title="Marquer comme lu"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsUnread(notification.id)}
                              title="Marquer comme non lu"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>Aucune notification trouvée</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Paramètres généraux */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Paramètres Généraux
                </CardTitle>
                <CardDescription>
                  Configurez vos préférences de notification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications par email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir les notifications par email
                    </p>
                  </div>
                  <Switch
                    checked={settings.email_notifications}
                    onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications push</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications dans le navigateur
                    </p>
                  </div>
                  <Switch
                    checked={settings.push_notifications}
                    onCheckedChange={(checked) => updateSetting('push_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      {settings.sound_notifications ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      Notifications sonores
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Jouer un son pour les nouvelles notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.sound_notifications}
                    onCheckedChange={(checked) => updateSetting('sound_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications desktop</Label>
                    <p className="text-sm text-muted-foreground">
                      Afficher les notifications sur le bureau
                    </p>
                  </div>
                  <Switch
                    checked={settings.desktop_notifications}
                    onCheckedChange={(checked) => updateSetting('desktop_notifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Types de notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Types de Notifications
                </CardTitle>
                <CardDescription>
                  Choisissez les événements à surveiller
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertes de sécurité</Label>
                    <p className="text-sm text-muted-foreground">
                      Tentatives de connexion, violations
                    </p>
                  </div>
                  <Switch
                    checked={settings.security_alerts}
                    onCheckedChange={(checked) => updateSetting('security_alerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Signalements utilisateurs</Label>
                    <p className="text-sm text-muted-foreground">
                      Nouveaux signalements de contenu
                    </p>
                  </div>
                  <Switch
                    checked={settings.user_reports}
                    onCheckedChange={(checked) => updateSetting('user_reports', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mises à jour système</Label>
                    <p className="text-sm text-muted-foreground">
                      Sauvegardes, maintenance, erreurs
                    </p>
                  </div>
                  <Switch
                    checked={settings.system_updates}
                    onCheckedChange={(checked) => updateSetting('system_updates', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Nouvelles inscriptions</Label>
                    <p className="text-sm text-muted-foreground">
                      Nouveaux comptes utilisateurs
                    </p>
                  </div>
                  <Switch
                    checked={settings.new_registrations}
                    onCheckedChange={(checked) => updateSetting('new_registrations', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Soumissions de projets</Label>
                    <p className="text-sm text-muted-foreground">
                      Nouveaux projets publiés
                    </p>
                  </div>
                  <Switch
                    checked={settings.project_submissions}
                    onCheckedChange={(checked) => updateSetting('project_submissions', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertes d'erreur</Label>
                    <p className="text-sm text-muted-foreground">
                      Erreurs système et API
                    </p>
                  </div>
                  <Switch
                    checked={settings.error_alerts}
                    onCheckedChange={(checked) => updateSetting('error_alerts', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}