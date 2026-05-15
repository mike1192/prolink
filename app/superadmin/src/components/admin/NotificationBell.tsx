import { useState, useEffect } from "react";
import { Bell, BellRing, X, Eye, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'security';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
}

// Données simulées pour les notifications en temps réel
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'security',
    title: 'Tentative de connexion suspecte',
    message: 'Plusieurs tentatives de connexion échouées détectées',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read: false,
    priority: 'urgent',
    action_url: '/audit-logs'
  },
  {
    id: '2',
    type: 'warning',
    title: 'Utilisation élevée du serveur',
    message: 'CPU à 85% pendant plus de 10 minutes',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    read: false,
    priority: 'high',
    action_url: '/system-monitoring'
  },
  {
    id: '3',
    type: 'info',
    title: 'Nouveau projet soumis',
    message: 'Marie Dubois a publié "App Mobile E-commerce"',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read: false,
    priority: 'medium',
    action_url: '/projects'
  }
];

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent' && !n.read).length;

  // Simulation de nouvelles notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.05) { // 5% de chance toutes les 10 secondes
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: ['info', 'warning', 'success'][Math.floor(Math.random() * 3)] as any,
          title: 'Nouvelle notification',
          message: 'Notification générée automatiquement pour la démo',
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'medium'
        };
        
        setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Garder max 10 notifications
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.action_url) {
      navigate(notification.action_url);
    }
    setIsOpen(false);
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <Info className="h-3 w-3 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'error':
        return <X className="h-3 w-3 text-red-500" />;
      case 'success':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'security':
        return <AlertTriangle className="h-3 w-3 text-red-600" />;
      default:
        return <Bell className="h-3 w-3 text-gray-500" />;
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

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <motion.div
            animate={urgentCount > 0 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: urgentCount > 0 ? Infinity : 0, duration: 2 }}
          >
            {unreadCount > 0 ? (
              <BellRing className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
          </motion.div>
          
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <Badge 
                  className={`h-5 w-5 p-0 text-xs flex items-center justify-center ${
                    urgentCount > 0 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                Tout marquer lu
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''} notification{unreadCount > 1 ? 's' : ''}
              {urgentCount > 0 && (
                <span className="text-red-600 font-medium">
                  {' '}• {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
                </span>
              )}
            </p>
          )}
        </div>

        <ScrollArea className="h-96">
          <div className="p-2">
            <AnimatePresence>
              {notifications.slice(0, 8).map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors hover:bg-muted/50 ${
                    !notification.read ? 'bg-blue-50/50 border border-blue-200' : 'border border-transparent'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getTypeIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                        
                        {notification.priority === 'urgent' && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            Urgent
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {notifications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune notification</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => {
                navigate('/notifications');
                setIsOpen(false);
              }}
            >
              <Eye className="h-3 w-3 mr-2" />
              Voir toutes les notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}