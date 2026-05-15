import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification,
} from "@/lib/api";
import {
  Bell,
  Heart,
  MessageSquare,
  UserPlus,
  Rocket,
  Check,
  Trash2,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarBadge } from "@/components/AvatarBadge";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery as useRouterQuery } from "@tanstack/react-query";
import { fetchUserProjects } from "@/lib/api";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
  head: () => ({
    meta: [{ title: "Notifications — ProjectLink" }],
  }),
});

function NotificationsPage() {
  const { user, loading, token } = useAuth();
  const qc = useQueryClient();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", showUnreadOnly],
    queryFn: () =>
      token
        ? fetchNotifications(token, 1, 50, showUnreadOnly)
        : { notifications: [], total: 0, unread_count: 0, page: 1, limit: 50 },
    enabled: !!token,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

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

  const handleMarkAsRead = async (notificationId: string) => {
    if (!token) return;
    try {
      await markNotificationAsRead(notificationId, token);
      qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      toast.error("Erreur lors du marquage");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token) return;
    try {
      await markAllNotificationsAsRead(token);
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Toutes les notifications marquées comme lues");
    } catch {
      toast.error("Erreur lors du marquage");
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!token) return;
    try {
      await deleteNotification(notificationId, token);
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-pink" />;
      case "comment":
      case "reply":
        return <MessageSquare className="h-4 w-4 text-neon" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case "project_update":
        return <Rocket className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "à l'instant";
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} h`;
    const d = Math.floor(h / 24);
    return `${d} j`;
  };

  const notifications = data?.notifications || [];
  const unreadCount = data?.unread_count || 0;

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {unreadCount} notification{unreadCount > 1 ? "s" : ""} non lue
                    {unreadCount > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Tout marquer comme lu
              </Button>
            )}
          </div>
        </motion.div>

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex gap-2"
        >
          <Button
            variant={!showUnreadOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowUnreadOnly(false)}
          >
            Toutes
          </Button>
          <Button
            variant={showUnreadOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowUnreadOnly(true)}
          >
            Non lues
            {unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-primary-foreground px-2 py-0.5 text-xs font-bold text-primary">
                {unreadCount}
              </span>
            )}
          </Button>
        </motion.div>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/40" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl p-12 text-center"
            >
              <Bell className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
              <h3 className="mb-2 text-lg font-semibold">Aucune notification</h3>
              <p className="text-sm text-muted-foreground">
                {showUnreadOnly
                  ? "Vous n'avez aucune notification non lue"
                  : "Vos notifications apparaîtront ici"}
              </p>
            </motion.div>
          ) : (
            notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`glass rounded-xl p-4 transition-all hover:shadow-md ${
                  !notification.is_read ? "border-l-4 border-l-primary" : ""
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <AvatarBadge
                      name={notification.sender?.display_name || notification.sender?.username}
                      url={notification.sender?.avatar_url}
                      size="sm"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          {getNotificationIcon(notification.type)}
                          {notification.project_id ? (
                            <Link
                              to="/u/$username"
                              params={{ username: notification.sender?.username || "" }}
                              className="text-sm font-semibold hover:text-primary transition-colors"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              {notification.title}
                            </Link>
                          ) : (
                            <h4 className="text-sm font-semibold">{notification.title}</h4>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {timeAgo(notification.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
