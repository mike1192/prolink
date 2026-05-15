import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Types pour les événements temps réel
export interface RealTimeEvent {
  type: 'user_created' | 'user_updated' | 'user_deleted' | 
        'project_created' | 'project_updated' | 'project_deleted' | 'project_liked' |
        'comment_created' | 'comment_deleted' |
        'message_sent' | 'message_read' |
        'notification_created' | 'notification_read' |
        'connection_created' | 'connection_accepted' |
        'branding_updated' | 'platform_settings_updated';
  data: any;
  timestamp: string;
  userId?: string;
}

// Hook pour la synchronisation temps réel de l'app principale
export const useRealTimeSync = (userId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let isActive = true;

    // Fonction pour vérifier si le serveur est disponible
    const checkServerHealth = async (): Promise<boolean> => {
      try {
        const response = await fetch('http://localhost:3003/health', {
          method: 'GET',
          timeout: 2000
        } as RequestInit);
        return response.ok;
      } catch {
        return false;
      }
    };

    const connectWebSocket = async () => {
      if (!isActive) return;

      // Vérifier d'abord si le serveur est disponible
      const serverAvailable = await checkServerHealth();
      if (!serverAvailable) {
        console.log('🔍 Serveur non disponible pour sync temps réel');
        setTimeout(() => {
          if (isActive) connectWebSocket();
        }, 15000);
        return;
      }

      try {
        ws = new WebSocket(`ws://localhost:3003`);

        const connectionTimeout = setTimeout(() => {
          if (ws && ws.readyState === WebSocket.CONNECTING) {
            ws.close();
          }
        }, 3000);

        ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('🔌 Sync temps réel connecté');
          
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'user_join',
              userId: userId
            }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const message: RealTimeEvent = JSON.parse(event.data);
            handleRealTimeEvent(message);
          } catch (error) {
            // Ignorer les erreurs de parsing silencieusement
          }
        };

        ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          if (event.code !== 1000 && isActive) {
            // Reconnecter après 10 secondes
            reconnectTimer = setTimeout(() => {
              if (isActive) connectWebSocket();
            }, 10000);
          }
        };

        ws.onerror = () => {
          clearTimeout(connectionTimeout);
          // Erreur silencieuse
        };

      } catch (error) {
        // Erreur silencieuse lors de la création
      }
    };

    // Fonction pour gérer les événements temps réel
    const handleRealTimeEvent = (event: RealTimeEvent) => {
      console.log('📡 Événement temps réel:', event.type);

      switch (event.type) {
        // Événements utilisateurs
        case 'user_created':
        case 'user_updated':
          queryClient.invalidateQueries({ queryKey: ['users'] });
          queryClient.invalidateQueries({ queryKey: ['connections'] });
          queryClient.invalidateQueries({ queryKey: ['suggestions'] });
          break;

        case 'user_deleted':
          queryClient.invalidateQueries({ queryKey: ['users'] });
          queryClient.invalidateQueries({ queryKey: ['connections'] });
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          break;

        // Événements projets
        case 'project_created':
        case 'project_updated':
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          queryClient.invalidateQueries({ queryKey: ['user-projects'] });
          queryClient.invalidateQueries({ queryKey: ['trending-projects'] });
          break;

        case 'project_deleted':
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          queryClient.invalidateQueries({ queryKey: ['user-projects'] });
          queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
          break;

        case 'project_liked':
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          queryClient.invalidateQueries({ queryKey: ['project', event.data.projectId] });
          break;

        // Événements commentaires
        case 'comment_created':
        case 'comment_deleted':
          queryClient.invalidateQueries({ queryKey: ['comments'] });
          queryClient.invalidateQueries({ queryKey: ['project', event.data.projectId] });
          break;

        // Événements messages
        case 'message_sent':
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          break;

        case 'message_read':
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['unread-count'] });
          break;

        // Événements notifications
        case 'notification_created':
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
          // Afficher une notification toast si c'est pour cet utilisateur
          if (event.data.userId === userId) {
            showNotificationToast(event.data);
          }
          break;

        case 'notification_read':
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
          break;

        // Événements connexions
        case 'connection_created':
        case 'connection_accepted':
          queryClient.invalidateQueries({ queryKey: ['connections'] });
          queryClient.invalidateQueries({ queryKey: ['suggestions'] });
          break;

        // Événements plateforme
        case 'branding_updated':
          queryClient.invalidateQueries({ queryKey: ['branding-config'] });
          // Recharger la page pour appliquer les nouveaux styles
          window.location.reload();
          break;

        case 'platform_settings_updated':
          queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
          break;
      }
    };

    // Fonction pour afficher les notifications toast
    const showNotificationToast = (notification: any) => {
      // Utiliser la bibliothèque de toast disponible (sonner, react-hot-toast, etc.)
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico'
          });
        }
      }
    };

    // Démarrer la connexion après 2 secondes
    const initialDelay = setTimeout(() => {
      if (isActive) connectWebSocket();
    }, 2000);

    return () => {
      isActive = false;
      clearTimeout(initialDelay);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close(1000, 'Component unmounted');
    };
  }, [userId, queryClient]);
};

// Hook pour demander les permissions de notification
export const useNotificationPermission = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);
};