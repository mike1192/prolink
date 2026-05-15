import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3003";
const MAX_QUEUE_SIZE = 100; // Max messages to queue when offline

interface QueuedMessage {
  event: string;
  data: unknown;
  timestamp: number;
}

export function useWebSocket(
  onNotification?: (notification: unknown) => void,
  onMessage?: (message: unknown) => void,
  onTyping?: (data: unknown) => void,
  onMessageRead?: (data: unknown) => void,
  onMessageSent?: (message: unknown) => void,
) {
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef({
    onNotification,
    onMessage,
    onTyping,
    onMessageRead,
    onMessageSent,
  });
  const messageQueueRef = useRef<QueuedMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttemptRef = useRef(0);
  const { user, token } = useAuth();

  useEffect(() => {
    callbacksRef.current = {
      onNotification,
      onMessage,
      onTyping,
      onMessageRead,
      onMessageSent,
    };
  }, [onNotification, onMessage, onTyping, onMessageRead, onMessageSent]);

  useEffect(() => {
    if (!user || !token) {
      // Disconnect if no user
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // 🔄 IMPROVED: Auto-reconnect with exponential backoff
    const createSocket = () => {
      socketRef.current = io(SOCKET_URL, {
        auth: {
          token: `Bearer ${token}`,
        },
        // Reconnection settings for reliability
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity, // Retry forever with backoff
        transports: ["websocket", "polling"],
      });

      // Join room with user ID
      socketRef.current.emit("join", user.id);

      // 📨 Listen for new notifications
      socketRef.current.on("new_notification", (notification) => {
        console.log("📥 Nouvelle notification reçue:", notification);

        toast.info(notification.title as string, {
          description: notification.message as string,
          duration: 5000,
        });

        callbacksRef.current.onNotification?.(notification);
      });

      // 📨 Listen for new messages
      socketRef.current.on("new_message", (message) => {
        console.log("📨 Nouveau message reçu:", message);

        const msg = message as Record<string, unknown>;
        const sender = msg.sender as Record<string, unknown> | undefined;
        toast.info(`Nouveau message de ${(sender?.display_name || sender?.username) as string}`, {
          description: msg.content as string,
          duration: 5000,
        });

        callbacksRef.current.onMessage?.(message);
      });

      // ⌨️ Listen for typing indicators
      socketRef.current.on("user_typing", (data) => {
        console.log("⌨️ Utilisateur en train d'écrire:", data);
        callbacksRef.current.onTyping?.(data);
      });

      // ✅ Listen for message read receipts
      socketRef.current.on("message_read", (data) => {
        console.log("✅ Message lu:", data);
        callbacksRef.current.onMessageRead?.(data);
      });

      // ✅ Listen for message sent confirmation
      socketRef.current.on("message_sent", (message) => {
        console.log("✅ Message envoyé confirmé:", message);
        callbacksRef.current.onMessageSent?.(message);
      });

      // 🔌 Connection established
      socketRef.current.on("connect", () => {
        console.log("✅ WebSocket connecté:", socketRef.current?.id);
        setIsConnected(true);
        reconnectAttemptRef.current = 0;

        // 📤 Flush queued messages when reconnected
        if (messageQueueRef.current.length > 0) {
          console.log(`📤 Flushing ${messageQueueRef.current.length} queued messages`);
          messageQueueRef.current.forEach((msg) => {
            socketRef.current?.emit(msg.event, msg.data);
          });
          messageQueueRef.current = [];
          toast.success("Messages synchronisés");
        }
      });

      // 🔌 Disconnected
      socketRef.current.on("disconnect", () => {
        console.log("❌ WebSocket déconnecté");
        setIsConnected(false);
        toast.warning("Connexion perdue - tentative de reconnexion...");
      });

      // ❌ Connection error with queue strategy
      socketRef.current.on("connect_error", (error) => {
        console.error("❌ Erreur de connexion WebSocket:", error);
        reconnectAttemptRef.current += 1;

        if (reconnectAttemptRef.current > 5) {
          toast.error("Impossible de se connecter. Veuillez vérifier votre connexion.");
        }
      });

      // 🔄 Reconnect attempt
      socketRef.current.on("reconnect_attempt", () => {
        console.log(`🔄 Tentative de reconnexion n°${reconnectAttemptRef.current}`);
      });
    };

    createSocket();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [user, token]);

  // 📤 Utility to emit with queue fallback
  const emit = (event: string, data: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      // 📋 Queue message if offline
      if (messageQueueRef.current.length < MAX_QUEUE_SIZE) {
        messageQueueRef.current.push({
          event,
          data,
          timestamp: Date.now(),
        });
        console.log(`📋 Message queued (${messageQueueRef.current.length}/${MAX_QUEUE_SIZE})`);
      } else {
        console.warn("⚠️ Message queue full - message dropped");
      }
    }
  };

  return {
    socket: socketRef,
    isConnected,
    emit,
    queueSize: messageQueueRef.current.length,
  };
}
