import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import { searchAllMessages, type Message } from "@/lib/api";
import { Search, MessageCircle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AvatarBadge } from "@/components/AvatarBadge";

export const Route = createFileRoute("/messages-search")({
  component: MessagesSearchPage,
  head: () => ({
    meta: [{ title: "Recherche Messages — ProjectLink" }],
  }),
});

function MessagesSearchPage() {
  const { user, loading, token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ["global-message-search", searchQuery],
    queryFn: () => (token && searchQuery.length >= 2 ? searchAllMessages(searchQuery, token) : []),
    enabled: searchQuery.length >= 2 && !!token,
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
      <main className="mx-auto max-w-4xl px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Search className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Recherche dans les messages</h1>
          </div>
          <p className="text-muted-foreground">Recherchez dans toutes vos conversations</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg"
              autoFocus
            />
          </div>
        </motion.div>

        <div className="space-y-3">
          {isLoading && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Recherche en cours...</p>
            </div>
          )}

          {!isLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="glass rounded-2xl p-12 text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="mb-2 text-lg font-semibold">Aucun résultat</h3>
              <p className="text-sm text-muted-foreground">
                Aucun message ne correspond à "{searchQuery}"
              </p>
            </div>
          )}

          {searchResults.map((message: Message & { other_user_name?: string }, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <AvatarBadge name={message.other_user_name || "Utilisateur"} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold">
                      {message.other_user_name || "Conversation"}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(message.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 break-words">{message.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {message.audio_url && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        🎤 Message vocal
                      </span>
                    )}
                    {message.file_url && !message.audio_url && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        📎 Fichier joint
                      </span>
                    )}
                    {message.forwarded_from && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        ↪ Transféré
                      </span>
                    )}
                    <Link
                      to="/chat"
                      className="text-xs text-primary hover:underline flex items-center gap-1 ml-auto"
                    >
                      Voir la conversation
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {searchResults.length > 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {searchResults.length} résultat{searchResults.length > 1 ? "s" : ""} trouvé
            {searchResults.length > 1 ? "s" : ""}
          </div>
        )}
      </main>
    </div>
  );
}
