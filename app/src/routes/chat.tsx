import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import {
  fetchConversations,
  fetchConversation,
  sendMessage,
  markConversationAsRead,
  searchMessages,
  uploadAudio,
  uploadFile,
  fetchProfileById,
  addMessageReaction,
  fetchMessageReactions,
  updateMessage,
  deleteMessage,
  pinMessage,
  unpinMessage,
  forwardMessage,
  type Message,
  type Conversation,
  type Profile,
} from "@/lib/api";
import {
  MessageCircle,
  Search,
  Send,
  Users,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Image as ImageIcon,
  File,
  FileVideo,
  X,
  Pin,
  Forward,
  Mic,
  Play,
  Pause,
  MoreVertical,
  ArrowLeft,
  Pencil,
  Trash2,
  Copy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { AvatarBadge } from "@/components/AvatarBadge";
import { toast } from "sonner";
import { useWebSocket } from "@/hooks/useWebSocket";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MAX_CHAT_FILE_SIZE_MB = 20;
const MAX_CHAT_FILE_SIZE_BYTES = MAX_CHAT_FILE_SIZE_MB * 1024 * 1024;

export const Route = createFileRoute("/chat")({
  component: ChatPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      userId: typeof search.userId === "string" ? search.userId : undefined,
    };
  },
  head: () => ({
    meta: [{ title: "Chat — ProjectLink" }],
  }),
});

function ChatPage() {
  const { user, loading, token } = useAuth();
  const { userId: userIdFromSearch } = Route.useSearch();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState<string | null>(null);
  const [messageReactions, setMessageReactions] = useState<
    Record<string, Array<{ emoji: string; count: number; users: Array<Record<string, unknown>> }>>
  >({});
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [openChatIds, setOpenChatIds] = useState<string[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [, setAudioProgress] = useState<Record<string, number>>({});
  const [, setForwardingMessage] = useState<string | null>(null);
  const [, setForwardTargetId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const qc = useQueryClient();
  const openChatsStorageKey = user?.id ? `vivid-open-chats:${user.id}` : null;

  const clearSelectedFile = useCallback(() => {
    if (filePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [filePreview]);

  // Auto-select user from search param (when coming from ProjectCard)
  useEffect(() => {
    if (userIdFromSearch) {
      setSelectedUserId(userIdFromSearch);
    }
  }, [userIdFromSearch]);

  useEffect(() => {
    if (!openChatsStorageKey) return;

    try {
      const storedChatIds = JSON.parse(localStorage.getItem(openChatsStorageKey) || "[]");
      if (Array.isArray(storedChatIds)) {
        setOpenChatIds(storedChatIds.filter((id): id is string => typeof id === "string"));
      }
    } catch {
      setOpenChatIds([]);
    }
  }, [openChatsStorageKey]);

  useEffect(() => {
    if (!selectedUserId || !openChatsStorageKey) return;

    setOpenChatIds((currentChatIds) => {
      const nextChatIds = [
        selectedUserId,
        ...currentChatIds.filter((chatId) => chatId !== selectedUserId),
      ];
      localStorage.setItem(openChatsStorageKey, JSON.stringify(nextChatIds));
      return nextChatIds;
    });
  }, [selectedUserId, openChatsStorageKey]);

  // Memoize WebSocket callbacks to prevent unnecessary reconnections
  const handleNewMessage = useCallback(
    (message: unknown) => {
      console.log("📨 Nouveau message reçu dans le chat:", message);
      // Refresh the conversation when a new message arrives
      if (selectedUserId) {
        qc.invalidateQueries({ queryKey: ["conversation", selectedUserId] });
        qc.invalidateQueries({ queryKey: ["conversations"] });
      }
    },
    [selectedUserId, qc],
  );

  const handleTyping = useCallback((typingData: unknown) => {
    const data = typingData as { senderId: string; isTyping: boolean };
    setTypingUsers((prev) => {
      const next = new Set(prev);
      if (data.isTyping) {
        next.add(data.senderId);
      } else {
        next.delete(data.senderId);
      }
      return next;
    });
  }, []);

  const handleMessageRead = useCallback(
    (readData: unknown) => {
      console.log("✅ Messages lus:", readData);
      // Refresh to update read status
      qc.invalidateQueries({ queryKey: ["conversation", selectedUserId] });
    },
    [selectedUserId, qc],
  );

  const handleMessageSent = useCallback(
    (message: unknown) => {
      console.log("✅ Confirmation d'envoi reçue:", message);
      // Refresh the conversation when our message is confirmed sent
      if (selectedUserId) {
        qc.invalidateQueries({ queryKey: ["conversation", selectedUserId] });
        qc.invalidateQueries({ queryKey: ["conversations"] });
      }
    },
    [selectedUserId, qc],
  );

  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => (token ? fetchConversations(token) : []),
    enabled: !!token,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: openChatProfiles = [] } = useQuery({
    queryKey: ["open-chat-profiles", openChatIds],
    queryFn: async () => {
      const profiles = await Promise.all(openChatIds.map((chatId) => fetchProfileById(chatId)));
      return profiles.filter((profile): profile is Profile => Boolean(profile));
    },
    enabled: openChatIds.length > 0,
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["conversation", selectedUserId],
    queryFn: () => (selectedUserId && token ? fetchConversation(selectedUserId, token) : []),
    enabled: !!selectedUserId && !!token,
    refetchInterval: 3000, // Refresh every 3 seconds for real-time feel
  });

  // WebSocket for real-time updates
  const socket = useWebSocket(
    undefined, // notifications handled elsewhere
    handleNewMessage,
    handleTyping,
    handleMessageRead,
    handleMessageSent,
  );

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedUserId && token) {
      markConversationAsRead(selectedUserId, token).catch(console.error);
    }
  }, [selectedUserId, token]);

  // Typing indicator
  const handleInputTyping = useCallback(() => {
    if (!selectedUserId || !token || !socket?.current) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.current?.emit("typing", {
        receiverId: selectedUserId,
        conversationId: [user?.id, selectedUserId].sort().join("_"),
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.current?.emit("stop_typing", {
        receiverId: selectedUserId,
        conversationId: [user?.id, selectedUserId].sort().join("_"),
      });
    }, 2000);
  }, [selectedUserId, token, isTyping, user?.id, socket]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (filePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_CHAT_FILE_SIZE_BYTES) {
      toast.error(`Fichier trop volumineux (max ${MAX_CHAT_FILE_SIZE_MB}MB)`);
      e.target.value = "";
      return;
    }

    if (filePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(filePreview);
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
  };

  const handleSearchMessages = async () => {
    if (!selectedUserId || !token || messageSearch.length < 2) return;

    setIsSearching(true);
    try {
      const results = await searchMessages(selectedUserId, messageSearch, token);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching messages:", error);
      toast.error("Erreur lors de la recherche");
    } finally {
      setIsSearching(false);
    }
  };

  // Voice recording handler
  const handleVoiceRecording = async (audioFile: File, duration: number) => {
    if (!selectedUserId || !token) return;

    try {
      toast.info("Upload de l'audio...");
      const { url: audioUrl } = await uploadAudio(audioFile, token);

      const sentMessage = await sendMessage(selectedUserId, "", token, null, null, audioUrl, duration);

      const optimisticConversationId =
        user?.id && selectedUserId ? [user.id, selectedUserId].sort().join("_") : "";

      qc.setQueryData(["conversation", selectedUserId], (current: Message[] | undefined) => {
        const previousMessages = current ?? [];
        const nextMessage: Message = {
          id: sentMessage.id || `temp-audio-${Date.now()}`,
          sender_id: sentMessage.sender_id || user?.id || "",
          receiver_id: sentMessage.receiver_id || selectedUserId,
          content: sentMessage.content ?? "",
          file_url: sentMessage.file_url ?? null,
          file_type: sentMessage.file_type ?? null,
          audio_url: sentMessage.audio_url ?? audioUrl,
          audio_duration: sentMessage.audio_duration ?? duration,
          conversation_id: sentMessage.conversation_id || optimisticConversationId,
          is_read: Boolean(sentMessage.is_read),
          read_at: sentMessage.read_at ?? null,
          is_pinned: Boolean(sentMessage.is_pinned),
          forwarded_from: sentMessage.forwarded_from ?? null,
          created_at: sentMessage.created_at || new Date().toISOString(),
          sender:
            sentMessage.sender ||
            (user
              ? {
                  id: user.id,
                  display_name: user.display_name ?? null,
                  username: user.username,
                  avatar_url: user.avatar_url ?? null,
                }
              : undefined),
        };

        if (previousMessages.some((message) => message.id === nextMessage.id)) {
          return previousMessages;
        }

        return [...previousMessages, nextMessage];
      });

      setNewMessage("");
      clearSelectedFile();

      await qc.invalidateQueries({ queryKey: ["conversation", selectedUserId] });
      await qc.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Message vocal envoyé");
    } catch (error) {
      console.error("Error sending voice message:", error);
      toast.error("Erreur lors de l'envoi du message vocal");
    }
  };

  // Emoji reaction handler
  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!token) return;

    try {
      await addMessageReaction(messageId, emoji, token);
      setShowEmojiPicker(false);
      setSelectedMessageForReaction(null);

      // Refresh reactions
      const reactions = await fetchMessageReactions(messageId, token);
      setMessageReactions((prev) => ({ ...prev, [messageId]: reactions }));
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error("Erreur lors de l'ajout de la réaction");
    }
  };

  // Pin/Unpin handler
  const handleTogglePin = async (messageId: string, isPinned: boolean) => {
    if (!token) return;

    try {
      if (isPinned) {
        await unpinMessage(messageId, token);
        setPinnedMessages((prev) => prev.filter((m) => m.id !== messageId));
        toast.success("Message désépinglé");
      } else {
        await pinMessage(messageId, token);
        const msg = messages.find((m: Message) => m.id === messageId);
        if (msg) {
          setPinnedMessages((prev) => [msg, ...prev]);
        }
        toast.success("Message épinglé");
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Erreur lors de l'épinglage");
    }
  };

  // Audio player handler
  const handlePlayAudio = (audioUrl: string, messageId: string) => {
    if (playingAudio === messageId) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(messageId);
    }
  };

  // Forward message handler
  const handleForwardMessage = async (messageId: string, targetUserId: string) => {
    if (!token || !targetUserId) return;

    try {
      await forwardMessage(messageId, targetUserId, token);
      setForwardingMessage(null);
      setForwardTargetId("");
      toast.success("Message transféré");
    } catch (error) {
      console.error("Error forwarding message:", error);
      toast.error("Erreur lors du transfert");
    }
  };

  const handleStartEditMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const handleCancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleSaveEditMessage = async (messageId: string) => {
    if (!token || !selectedUserId || !editingContent.trim()) return;

    try {
      const updatedMessage = await updateMessage(messageId, editingContent.trim(), token);

      qc.setQueryData(["conversation", selectedUserId], (current: Message[] | undefined) =>
        (current ?? []).map((message) =>
          message.id === messageId
            ? { ...message, content: updatedMessage.content ?? editingContent.trim() }
            : message,
        ),
      );

      setEditingMessageId(null);
      setEditingContent("");
      await qc.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Message modifié");
    } catch (error) {
      console.error("Error updating message:", error);
      toast.error("Impossible de modifier ce message");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!token || !selectedUserId) return;

    const shouldDelete = window.confirm("Supprimer ce message ?");
    if (!shouldDelete) return;

    try {
      await deleteMessage(messageId, token);
      qc.setQueryData(["conversation", selectedUserId], (current: Message[] | undefined) =>
        (current ?? []).filter((message) => message.id !== messageId),
      );
      await qc.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Message supprimé");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Impossible de supprimer ce message");
    }
  };

  const handleCopyMessage = async (content: string) => {
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      toast.success("Message copié");
    } catch {
      toast.error("Impossible de copier le message");
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !token || (!newMessage.trim() && !selectedFile)) return;

    try {
      // TODO: Upload file first if exists, then send message with file_url
      // For now, just send text message
      console.log("📤 Envoi du message...");
      const messageText = newMessage.trim();
      let uploadedFile: Awaited<ReturnType<typeof uploadFile>> | null = null;

      if (selectedFile) {
        toast.info("Upload du fichier...");
        uploadedFile = await uploadFile(selectedFile, token);
      }

      const contentToSend = messageText || uploadedFile?.originalName || "";
      const sentMessage = await sendMessage(
        selectedUserId,
        contentToSend,
        token,
        uploadedFile?.url ?? null,
        uploadedFile?.mimetype ?? null,
      );

      const optimisticConversationId =
        user?.id && selectedUserId ? [user.id, selectedUserId].sort().join("_") : "";

      qc.setQueryData(["conversation", selectedUserId], (current: Message[] | undefined) => {
        const previousMessages = current ?? [];
        const nextMessage: Message = {
          id: sentMessage.id || `temp-${Date.now()}`,
          sender_id: sentMessage.sender_id || user?.id || "",
          receiver_id: sentMessage.receiver_id || selectedUserId,
          content: sentMessage.content ?? contentToSend,
          file_url: sentMessage.file_url ?? uploadedFile?.url ?? null,
          file_type: sentMessage.file_type ?? uploadedFile?.mimetype ?? null,
          audio_url: sentMessage.audio_url ?? null,
          audio_duration: sentMessage.audio_duration ?? null,
          conversation_id: sentMessage.conversation_id || optimisticConversationId,
          is_read: Boolean(sentMessage.is_read),
          read_at: sentMessage.read_at ?? null,
          is_pinned: Boolean(sentMessage.is_pinned),
          forwarded_from: sentMessage.forwarded_from ?? null,
          created_at: sentMessage.created_at || new Date().toISOString(),
          sender:
            sentMessage.sender ||
            (user
              ? {
                  id: user.id,
                  display_name: user.display_name ?? null,
                  username: user.username,
                  avatar_url: user.avatar_url ?? null,
                }
              : undefined),
        };

        if (previousMessages.some((message) => message.id === nextMessage.id)) {
          return previousMessages;
        }

        return [...previousMessages, nextMessage];
      });
      console.log("✅ Message envoyé avec succès");

      setNewMessage("");
      clearSelectedFile();
      // Reset typing
      setIsTyping(false);

      // Force immediate refetch (not just invalidate)
      console.log("🔄 Rechargement de la conversation...");
      await qc.refetchQueries({ queryKey: ["conversation", selectedUserId] });
      await qc.refetchQueries({ queryKey: ["conversations"] });
      console.log("✅ Conversations rechargées");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi du message");
    }
  };

  const openChatConversations: Conversation[] = openChatProfiles.map((profile, index) => ({
    user_id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    job_title: profile.job_title ?? null,
    last_message: "Chat ouvert",
    last_message_at: new Date(Date.now() - index).toISOString(),
    unread_count: 0,
  }));

  const conversationsByUser = new Map<string, Conversation>();

  for (const openChat of openChatConversations) {
    conversationsByUser.set(openChat.user_id, openChat);
  }

  for (const conversation of conversations) {
    conversationsByUser.set(conversation.user_id, conversation);
  }

  const allConversations = Array.from(conversationsByUser.values()).sort(
    (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime(),
  );

  const filteredConversations = allConversations.filter((conv) => {
    const name = conv.display_name || conv.username;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedConversation = allConversations.find((c) => c.user_id === selectedUserId);

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

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <Header />
      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Messages</h1>
              <p className="text-sm text-muted-foreground">
                Conversations rapides, contacts pro et collaboration.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="overflow-hidden rounded-3xl border border-border/70 bg-background/80 shadow-[0_24px_80px_-45px_var(--foreground)] backdrop-blur"
        >
          <div className="grid min-h-[680px] grid-cols-1 md:h-[680px] md:grid-cols-[360px_minmax(0,1fr)]">
            {/* Liste des conversations */}
            <div
              className={`min-h-[680px] flex-col border-r border-border/70 bg-card/60 ${
                selectedUserId ? "hidden md:flex" : "flex"
              }`}
            >
              <div className="border-b border-border/70 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Inbox
                    </p>
                    <h2 className="text-lg font-bold">Conversations</h2>
                  </div>
                  <div className="flex h-9 min-w-9 items-center justify-center rounded-full bg-primary/10 px-3 text-sm font-semibold text-primary">
                    {filteredConversations.length}
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une conversation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 rounded-full border-border/70 bg-background/80 pl-10 shadow-sm"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {loadingConversations ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                    <MessageCircle className="mx-auto mb-4 h-14 w-14 text-muted-foreground opacity-50" />
                    <p className="text-lg font-semibold mb-2">Aucune conversation</p>
                    <p className="text-sm text-muted-foreground">
                      Commencez par contacter un membre de la communauté
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.user_id}
                        onClick={() => setSelectedUserId(conv.user_id)}
                        className={`w-full rounded-2xl border p-3 text-left transition-all ${
                          selectedUserId === conv.user_id
                            ? "border-primary/30 bg-primary/10 shadow-sm"
                            : "border-transparent hover:border-border/80 hover:bg-accent/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <AvatarBadge
                              name={conv.display_name || conv.username}
                              url={conv.avatar_url}
                              size="md"
                            />
                            {conv.unread_count > 0 && (
                              <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                {conv.unread_count > 9 ? "9+" : conv.unread_count}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <h3 className="font-semibold truncate">
                                {conv.display_name || conv.username}
                              </h3>
                              <span className="shrink-0 text-[11px] text-muted-foreground">
                                {timeAgo(conv.last_message_at)}
                              </span>
                            </div>
                            {conv.job_title && (
                              <p className="mb-1 truncate text-xs text-muted-foreground">
                                {conv.job_title}
                              </p>
                            )}
                            <p
                              className={`text-sm truncate ${
                                conv.unread_count > 0
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {conv.last_message}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Zone de chat */}
            <div
              className={`min-h-[680px] flex-col bg-muted/20 ${
                selectedUserId ? "flex" : "hidden md:flex"
              }`}
            >
              {!selectedUserId ? (
                <div className="flex flex-1 items-center justify-center p-8">
                  <div className="max-w-sm text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                      <MessageCircle className="h-10 w-10" />
                    </div>
                    <p className="mb-2 text-xl font-semibold">Bienvenue dans les messages</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Sélectionnez une conversation pour commencer
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header de la conversation */}
                  <div className="border-b border-border/70 bg-background/90 p-4 backdrop-blur">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedUserId(null)}
                          className="md:hidden"
                          aria-label="Retour aux conversations"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <AvatarBadge
                          name={selectedConversation?.display_name || ""}
                          url={selectedConversation?.avatar_url}
                          size="md"
                        />
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold">
                            {selectedConversation?.display_name || selectedConversation?.username}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            {selectedConversation?.job_title && (
                              <p className="truncate text-xs text-muted-foreground">
                                {selectedConversation.job_title}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-5 sm:px-6">
                    {loadingMessages ? (
                      <div className="text-center text-sm text-muted-foreground">Chargement...</div>
                    ) : messages.length === 0 ? (
                      <div className="mx-auto mt-12 max-w-sm rounded-3xl border border-dashed border-border bg-background/70 p-8 text-center text-muted-foreground">
                        <MessageCircle className="mx-auto mb-3 h-10 w-10 opacity-50" />
                        <p className="font-semibold text-foreground">Aucun message</p>
                        <p className="text-sm">Envoyez le premier message !</p>
                      </div>
                    ) : (
                      <>
                        {/* Pinned Messages */}
                        {pinnedMessages.length > 0 && (
                          <div className="mb-4 space-y-2 rounded-2xl border border-yellow-200/70 bg-yellow-50/70 p-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                              <Pin className="h-4 w-4 text-yellow-500" />
                              <span>Messages épinglés ({pinnedMessages.length})</span>
                            </div>
                            {pinnedMessages.map((msg: Message) => (
                              <div
                                key={`pinned-${msg.id}`}
                                className="rounded-xl bg-background/80 p-3 text-sm shadow-sm"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
                                    {msg.content}
                                  </p>
                                  <button
                                    onClick={() => handleTogglePin(msg.id, true)}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {messages.map((message: Message) => {
                          const isMe = message.sender_id === user?.id;
                          const reactions = messageReactions[message.id] || [];

                          return (
                            <div
                              key={message.id}
                              className={`flex w-full min-w-0 ${isMe ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`group relative min-w-0 ${
                                  isMe ? "max-w-[82%] sm:max-w-[68%]" : "max-w-[88%] sm:max-w-[72%]"
                                }`}
                              >
                                <div
                                  className={`w-fit max-w-full overflow-hidden px-4 py-2.5 shadow-sm ring-1 ${
                                    isMe
                                      ? "rounded-[20px] rounded-br-md bg-primary text-primary-foreground ring-primary/20"
                                      : "rounded-[20px] rounded-bl-md bg-background text-foreground ring-border/70"
                                  }`}
                                >
                                  {/* Forwarded indicator */}
                                  {message.forwarded_from && (
                                    <div className="flex items-center gap-1 mb-1 text-xs opacity-70">
                                      <Forward className="h-3 w-3" />
                                      <span>Message transféré</span>
                                    </div>
                                  )}

                                  {/* Audio message */}
                                  {message.audio_url && (
                                    <div className="mb-1 flex min-w-[220px] items-center gap-3 sm:min-w-[260px]">
                                      <button
                                        onClick={() =>
                                          handlePlayAudio(message.audio_url!, message.id)
                                        }
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                                          isMe
                                            ? "bg-white text-primary hover:bg-white/90"
                                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                                        }`}
                                        aria-label={
                                          playingAudio === message.id
                                            ? "Mettre le vocal en pause"
                                            : "Lire le vocal"
                                        }
                                      >
                                        {playingAudio === message.id ? (
                                          <Pause className="h-4 w-4" />
                                        ) : (
                                          <Play className="h-4 w-4 translate-x-px" />
                                        )}
                                      </button>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex h-8 items-center gap-0.5">
                                          {Array.from({ length: 28 }).map((_, index) => {
                                            const heights = [
                                              8, 14, 20, 12, 26, 18, 10, 22, 30, 16, 12, 24, 18, 10,
                                              28, 20, 14, 22, 12, 18, 26, 16, 10, 24, 18, 12, 20,
                                              14,
                                            ];
                                            const isActive =
                                              playingAudio === message.id && index < 10;

                                            return (
                                              <span
                                                key={index}
                                                className={`w-1 rounded-full transition-colors ${
                                                  isMe
                                                    ? isActive
                                                      ? "bg-white"
                                                      : "bg-white/45"
                                                    : isActive
                                                      ? "bg-primary"
                                                      : "bg-muted-foreground/35"
                                                }`}
                                                style={{ height: `${heights[index]}px` }}
                                              />
                                            );
                                          })}
                                        </div>
                                        <div
                                          className={`mt-1 flex items-center justify-between text-[10px] ${
                                            isMe
                                              ? "text-primary-foreground/75"
                                              : "text-muted-foreground"
                                          }`}
                                        >
                                          <span>Message vocal</span>
                                          <span>
                                            {message.audio_duration
                                              ? `${Math.floor(message.audio_duration / 60)}:${(message.audio_duration % 60).toString().padStart(2, "0")}`
                                              : "0:00"}
                                          </span>
                                        </div>
                                      </div>
                                      {playingAudio === message.id && (
                                        <audio
                                          src={message.audio_url}
                                          autoPlay
                                          onEnded={() => setPlayingAudio(null)}
                                          className="hidden"
                                        />
                                      )}
                                    </div>
                                  )}

                                  {/* File attachment */}
                                  {message.file_url && !message.audio_url && (
                                    <div className="mb-2">
                                      {message.file_type?.startsWith("image/") ? (
                                        <img
                                          src={message.file_url}
                                          alt="Image"
                                          className="rounded-lg max-w-full h-auto max-h-60"
                                        />
                                      ) : message.file_type?.startsWith("video/") ? (
                                        <video
                                          src={message.file_url}
                                          controls
                                          className="max-h-72 max-w-full rounded-lg bg-black"
                                        />
                                      ) : (
                                        <a
                                          href={message.file_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`flex items-center gap-2 rounded-xl p-2 transition-colors ${
                                            isMe
                                              ? "bg-white/15 hover:bg-white/25"
                                              : "bg-muted hover:bg-muted/80"
                                          }`}
                                        >
                                          {message.file_type?.startsWith("video/") ? (
                                            <FileVideo className="h-4 w-4" />
                                          ) : (
                                            <File className="h-4 w-4" />
                                          )}
                                          <span className="text-xs break-all">
                                            {message.content || "Fichier joint"}
                                          </span>
                                        </a>
                                      )}
                                    </div>
                                  )}

                                  {/* Message content */}
                                  {message.content && (
                                    <>
                                      {editingMessageId === message.id ? (
                                        <form
                                          onSubmit={(event) => {
                                            event.preventDefault();
                                            handleSaveEditMessage(message.id);
                                          }}
                                          className="space-y-2"
                                        >
                                          <Input
                                            value={editingContent}
                                            onChange={(event) =>
                                              setEditingContent(event.target.value)
                                            }
                                            className="h-9 bg-background text-foreground"
                                            autoFocus
                                          />
                                          <div className="flex justify-end gap-1">
                                            <Button
                                              type="button"
                                              size="icon"
                                              variant="ghost"
                                              onClick={handleCancelEditMessage}
                                              className="h-7 w-7"
                                              aria-label="Annuler la modification"
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              type="submit"
                                              size="icon"
                                              variant="secondary"
                                              disabled={!editingContent.trim()}
                                              className="h-7 w-7"
                                              aria-label="Enregistrer la modification"
                                            >
                                              <Check className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </form>
                                      ) : (
                                        <p className="whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">
                                          {message.content}
                                        </p>
                                      )}
                                    </>
                                  )}

                                  {/* Reactions */}
                                  {reactions.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {reactions.map((reaction, idx) => (
                                        <button
                                          key={idx}
                                          onClick={() =>
                                            handleAddReaction(message.id, reaction.emoji)
                                          }
                                          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-xs"
                                        >
                                          <span>{reaction.emoji}</span>
                                          <span>{reaction.count}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {/* Timestamp and read receipts */}
                                  <div
                                    className={`flex items-center justify-between gap-2 mt-1 ${
                                      isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                                    }`}
                                  >
                                    <p className="text-[10px]">
                                      {new Date(message.created_at).toLocaleTimeString("fr-FR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                    {isMe && (
                                      <span className="ml-1">
                                        {message.is_read ? (
                                          <CheckCheck className="h-3 w-3 text-blue-300" />
                                        ) : (
                                          <Check className="h-3 w-3" />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Message actions menu */}
                                <div
                                  className={`absolute top-0 ${
                                    isMe ? "-left-10 sm:-left-20" : "-right-10 sm:-right-20"
                                  } opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100`}
                                >
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 bg-background/80 shadow-sm sm:bg-transparent sm:shadow-none"
                                      >
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                      {message.content && (
                                        <DropdownMenuItem
                                          onClick={() => handleCopyMessage(message.content)}
                                        >
                                          <Copy className="mr-2 h-4 w-4" />
                                          Copier
                                        </DropdownMenuItem>
                                      )}
                                      {isMe &&
                                        message.content &&
                                        !message.audio_url &&
                                        !message.file_url && (
                                          <DropdownMenuItem
                                            onClick={() => handleStartEditMessage(message)}
                                          >
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Modifier
                                          </DropdownMenuItem>
                                        )}
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedMessageForReaction(message.id);
                                          setShowEmojiPicker(true);
                                        }}
                                      >
                                        <Smile className="mr-2 h-4 w-4" />
                                        Réagir
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleTogglePin(message.id, message.is_pinned)
                                        }
                                      >
                                        <Pin className="mr-2 h-4 w-4" />
                                        {message.is_pinned ? "Désépingler" : "Épingler"}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setForwardingMessage(message.id);
                                          const targetId = prompt("ID du destinataire :");
                                          if (targetId) {
                                            handleForwardMessage(message.id, targetId);
                                          }
                                        }}
                                      >
                                        <Forward className="mr-2 h-4 w-4" />
                                        Transférer
                                      </DropdownMenuItem>
                                      {isMe && (
                                        <DropdownMenuItem
                                          onClick={() => handleDeleteMessage(message.id)}
                                          className="text-red-600 focus:text-red-600"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Supprimer
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                {/* Emoji picker popup */}
                                {showEmojiPicker && selectedMessageForReaction === message.id && (
                                  <div
                                    className={`absolute ${
                                      isMe ? "right-0" : "left-0"
                                    } bottom-full mb-2 z-50`}
                                  >
                                    <EmojiPicker
                                      onEmojiClick={(emojiData) => {
                                        handleAddReaction(message.id, emojiData.emoji);
                                      }}
                                      emojiStyle={EmojiStyle.NATIVE}
                                      lazyLoadEmojis
                                      width={300}
                                      height={400}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {/* Typing indicator */}
                        {typingUsers.size > 0 &&
                          selectedUserId &&
                          typingUsers.has(selectedUserId) && (
                            <div className="flex justify-start">
                              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                                <div className="flex gap-1">
                                  <div
                                    className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                                    style={{ animationDelay: "0ms" }}
                                  />
                                  <div
                                    className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                                    style={{ animationDelay: "150ms" }}
                                  />
                                  <div
                                    className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                                    style={{ animationDelay: "300ms" }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                      </>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input pour envoyer un message */}
                  <form
                    onSubmit={handleSendMessage}
                    className="border-t border-border/70 bg-background/95 p-3 backdrop-blur sm:p-4"
                  >
                    {/* File preview */}
                    {selectedFile && (
                      <div className="relative mb-3 inline-flex max-w-full items-center gap-3 rounded-2xl border border-border/80 bg-muted/60 p-2 pr-9 shadow-sm">
                        {filePreview && selectedFile.type.startsWith("image/") && (
                          <img
                            src={filePreview}
                            alt="Preview"
                            className="max-h-32 max-w-56 rounded-xl object-cover"
                          />
                        )}
                        {filePreview && selectedFile.type.startsWith("video/") && (
                          <video
                            src={filePreview}
                            className="max-h-32 max-w-56 rounded-xl bg-black object-cover"
                            controls
                          />
                        )}
                        {!selectedFile.type.startsWith("image/") &&
                          !selectedFile.type.startsWith("video/") && (
                            <File className="h-5 w-5 shrink-0 text-muted-foreground" />
                          )}
                        {selectedFile.type.startsWith("video/") && (
                          <FileVideo className="h-5 w-5 shrink-0 text-muted-foreground" />
                        )}
                        <span className="max-w-48 truncate text-xs font-medium">
                          {selectedFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={clearSelectedFile}
                          className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-sm hover:bg-red-600"
                          aria-label="Retirer le fichier"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-end gap-2 rounded-3xl border border-border/80 bg-muted/50 p-2 shadow-sm">
                      {/* File upload button */}
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-10 w-10 shrink-0 rounded-full bg-background"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      {/* Emoji picker button */}
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="h-10 w-10 shrink-0 rounded-full bg-background"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>

                      <div className="relative min-w-0 flex-1">
                        <Input
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleInputTyping();
                          }}
                          placeholder="Écrire un message..."
                        />
                        {/* Emoji picker popup */}
                        {showEmojiPicker && (
                          <div className="absolute bottom-full mb-2 left-0 z-50">
                            <EmojiPicker
                              onEmojiClick={(emojiData) => {
                                setNewMessage((prev) => prev + emojiData.emoji);
                              }}
                              emojiStyle={EmojiStyle.NATIVE}
                              lazyLoadEmojis
                              width={300}
                              height={400}
                            />
                          </div>
                        )}
                      </div>

                      {/* Voice recorder */}
                      <VoiceRecorder onRecordingComplete={handleVoiceRecording} />

                      <Button
                        type="submit"
                        size="icon"
                        disabled={!newMessage.trim() && !selectedFile}
                        className="h-10 w-10 shrink-0 rounded-full"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
