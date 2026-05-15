import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  RefreshCw, 
  Download, 
  MessageSquare, 
  Clock, 
  User, 
  Filter,
  Trash2,
  Flag,
  Eye
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useMessages } from "../../hooks/useAdminActions";
import { useQueryClient } from "@tanstack/react-query";

export default function Messages() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "flagged" | "recent">("all");
  
  const { data: messagesData, isLoading, refetch } = useMessages();
  const queryClient = useQueryClient();
  
  const messages = messagesData?.messages || [];

  const handleRefresh = () => {
    refetch();
    toast.success("Messages actualisés");
  };

  const exportMessages = () => {
    if (!messages.length) return;
    
    const csvData = [
      ['Date', 'Expéditeur', 'Destinataire', 'Message'],
      ...messages.map((msg: any) => [
        new Date(msg.created_at).toLocaleString('fr-FR'),
        msg.sender_name || msg.sender_username,
        msg.receiver_name || msg.receiver_username,
        msg.content.replace(/"/g, '""') // Échapper les guillemets
      ])
    ];
    
    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `messages-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    
    toast.success("Messages exportés");
  };

  const filteredMessages = messages.filter((msg: any) => {
    const matchesSearch = search === "" || 
      msg.content.toLowerCase().includes(search.toLowerCase()) ||
      (msg.sender_name || msg.sender_username || "").toLowerCase().includes(search.toLowerCase()) ||
      (msg.receiver_name || msg.receiver_username || "").toLowerCase().includes(search.toLowerCase());
    
    // Pour l'instant, on affiche tous les messages
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Surveillance des communications entre utilisateurs"
        action={
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button onClick={exportMessages} variant="outline" size="sm" disabled={!messages.length}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        }
      />

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Totaux</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : messages.length.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : messages.filter((msg: any) => {
                const today = new Date().toDateString();
                return new Date(msg.created_at).toDateString() === today;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : new Set([
                ...messages.map((msg: any) => msg.sender_username),
                ...messages.map((msg: any) => msg.receiver_username)
              ]).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher dans les messages..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'recent', 'flagged'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Tous' : f === 'recent' ? 'Récents' : 'Signalés'}
            </Button>
          ))}
        </div>
      </div>

      {/* Liste des messages */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              {search ? "Aucun message trouvé" : "Aucun message disponible"}
            </div>
          ) : (
            <div className="divide-y">
              {filteredMessages.map((message: any, index: number) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="p-4 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {(message.sender_name || message.sender_username || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {message.sender_name || message.sender_username}
                          </span>
                          <span className="text-muted-foreground text-xs">→</span>
                          <span className="text-sm text-muted-foreground">
                            {message.receiver_name || message.receiver_username}
                          </span>
                          <Badge variant="outline" className="text-xs ml-auto">
                            {formatDate(message.created_at)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {message.content}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.info("Message marqué comme lu")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.warning("Message signalé")}
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Supprimer ce message ?")) {
                            toast.error("Message supprimé");
                          }
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination si nécessaire */}
      {messagesData?.pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {messagesData.pagination.page} sur {messagesData.pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={messagesData.pagination.page === 1}
            >
              Précédent
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={messagesData.pagination.page === messagesData.pagination.totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
