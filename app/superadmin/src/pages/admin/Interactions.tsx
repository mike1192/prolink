import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  MessageSquare,
  Share2,
  Trash2,
  Flag,
  Search,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  TrendingUp,
  Filter,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  BarChart,
} from "recharts";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardStats } from "@/hooks/useRealTimeData";
import { useQueryClient } from "@tanstack/react-query";

export default function Interactions() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "flagged" | "recent" | "popular">("all");
  const [selectedTab, setSelectedTab] = useState("overview");
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useDashboardStats();

  // Simuler des données d'interactions en temps réel
  const [interactions, setInteractions] = useState([
    {
      id: "1",
      type: "like",
      user: { name: "Marie Dubois", avatar: "", username: "marie.d" },
      project: { title: "App Mobile E-commerce", id: "proj1" },
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      flagged: false,
    },
    {
      id: "2",
      type: "comment",
      user: { name: "Jean Martin", avatar: "", username: "jean.m" },
      project: { title: "Site Web Portfolio", id: "proj2" },
      content: "Excellent travail ! J'adore le design moderne.",
      timestamp: new Date(Date.now() - 12 * 60 * 1000),
      flagged: false,
    },
    {
      id: "3",
      type: "comment",
      user: { name: "Sophie Chen", avatar: "", username: "sophie.c" },
      project: { title: "API REST Node.js", id: "proj3" },
      content: "Spam message with inappropriate content...",
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      flagged: true,
    },
    {
      id: "4",
      type: "share",
      user: { name: "Alex Rivera", avatar: "", username: "alex.r" },
      project: { title: "Dashboard Analytics", id: "proj4" },
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      flagged: false,
    },
  ]);

  const engagementData = [
    { day: "Lun", likes: 245, comments: 89, shares: 23 },
    { day: "Mar", likes: 312, comments: 156, shares: 45 },
    { day: "Mer", likes: 189, comments: 98, shares: 12 },
    { day: "Jeu", likes: 456, comments: 234, shares: 67 },
    { day: "Ven", likes: 398, comments: 187, shares: 34 },
    { day: "Sam", likes: 234, comments: 123, shares: 28 },
    { day: "Dim", likes: 167, comments: 76, shares: 15 },
  ];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    toast.success("Données actualisées");
  };

  const handleDeleteInteraction = (id: string, type: string) => {
    if (confirm(`Supprimer cette ${type === "comment" ? "commentaire" : "interaction"} ?`)) {
      setInteractions((prev) => prev.filter((i) => i.id !== id));
      toast.success(`${type === "comment" ? "Commentaire" : "Interaction"} supprimé(e)`);
    }
  };

  const handleFlagInteraction = (id: string) => {
    setInteractions((prev) => prev.map((i) => (i.id === id ? { ...i, flagged: !i.flagged } : i)));
    const interaction = interactions.find((i) => i.id === id);
    toast.success(interaction?.flagged ? "Signalement retiré" : "Contenu signalé");
  };

  const exportInteractions = () => {
    const csvData = [
      ["Type", "Utilisateur", "Projet", "Contenu", "Date", "Signalé"],
      ...interactions.map((i) => [
        i.type,
        i.user.name,
        i.project.title,
        i.content || "-",
        i.timestamp.toLocaleString("fr-FR"),
        i.flagged ? "Oui" : "Non",
      ]),
    ];

    const csvContent = csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    toast.success("Interactions exportées");
  };

  const filteredInteractions = interactions.filter((interaction) => {
    const matchesSearch =
      search === "" ||
      interaction.user.name.toLowerCase().includes(search.toLowerCase()) ||
      interaction.project.title.toLowerCase().includes(search.toLowerCase()) ||
      (interaction.content && interaction.content.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter =
      filter === "all" ||
      (filter === "flagged" && interaction.flagged) ||
      (filter === "recent" && Date.now() - interaction.timestamp.getTime() < 60 * 60 * 1000) ||
      (filter === "popular" && interaction.type === "like");

    return matchesSearch && matchesFilter;
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return date.toLocaleDateString("fr-FR");
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-pink-500" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "share":
        return <Share2 className="h-4 w-4 text-purple-500" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interactions"
        description="Surveillance des commentaires, likes et activité en temps réel"
        action={
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
            <Button onClick={exportInteractions} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        }
      />

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          label="Likes (24h)"
          value={isLoading ? "..." : "42,189"}
          delta={18.2}
          icon={Heart}
          accent="pink"
          index={0}
        />
        <StatCard
          label="Commentaires"
          value={isLoading ? "..." : "8,420"}
          delta={9.1}
          icon={MessageSquare}
          accent="blue"
          index={1}
        />
        <StatCard
          label="Partages"
          value={isLoading ? "..." : "2,340"}
          delta={-3.4}
          icon={Share2}
          accent="violet"
          index={2}
        />
        <StatCard
          label="Signalements"
          value={interactions.filter((i) => i.flagged).length.toString()}
          delta={0}
          icon={Flag}
          accent="red"
          index={3}
        />
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="comments">Commentaires</TabsTrigger>
          <TabsTrigger value="likes">Likes</TabsTrigger>
          <TabsTrigger value="flagged">Signalés</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Graphique d'activité */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Activité Hebdomadaire
                </CardTitle>
                <CardDescription>
                  Évolution des interactions sur les 7 derniers jours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={engagementData}>
                    <CartesianGrid
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="likes" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="comments" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="shares" fill="hsl(var(--chart-3))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Activité récente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Activité Récente
                </CardTitle>
                <CardDescription>Dernières interactions sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[300px] overflow-auto">
                  <AnimatePresence>
                    {interactions.slice(0, 10).map((interaction, index) => (
                      <motion.div
                        key={interaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="mt-1">{getInteractionIcon(interaction.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{interaction.user.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {interaction.type === "like"
                                ? "a aimé"
                                : interaction.type === "comment"
                                  ? "a commenté"
                                  : "a partagé"}
                            </span>
                            {interaction.flagged && (
                              <Badge className="bg-red-100 text-red-800 text-xs">
                                <Flag className="h-3 w-3 mr-1" />
                                Signalé
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {interaction.project.title}
                          </p>
                          {interaction.content && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              "{interaction.content}"
                            </p>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(interaction.timestamp)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comments" className="space-y-6">
          {/* Filtres pour les commentaires */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher dans les commentaires..."
                    className="pl-10"
                  />
                </div>
                <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les commentaires</SelectItem>
                    <SelectItem value="recent">Récents (1h)</SelectItem>
                    <SelectItem value="flagged">Signalés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Liste des commentaires */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredInteractions
                  .filter((i) => i.type === "comment")
                  .map((comment, index) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {comment.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{comment.user.name}</span>
                            <span className="text-sm text-muted-foreground">
                              sur {comment.project.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(comment.timestamp)}
                            </span>
                            {comment.flagged && (
                              <Badge className="bg-red-100 text-red-800">
                                <Flag className="h-3 w-3 mr-1" />
                                Signalé
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{comment.content}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFlagInteraction(comment.id)}
                            className={comment.flagged ? "text-green-600" : "text-yellow-600"}
                          >
                            {comment.flagged ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Flag className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInteraction(comment.id, "comment")}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="likes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Likes Récents</CardTitle>
              <CardDescription>Derniers likes sur les projets de la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredInteractions
                  .filter((i) => i.type === "like")
                  .map((like, index) => (
                    <motion.div
                      key={like.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Heart className="h-5 w-5 text-pink-500" />
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {like.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{like.user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            a aimé {like.project.title}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(like.timestamp)}
                      </span>
                    </motion.div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flagged" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Contenu Signalé
              </CardTitle>
              <CardDescription>Interactions signalées nécessitant une modération</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredInteractions.filter((i) => i.flagged).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>Aucun contenu signalé</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInteractions
                    .filter((i) => i.flagged)
                    .map((flagged, index) => (
                      <motion.div
                        key={flagged.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-lg border border-red-200 bg-red-50"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">{getInteractionIcon(flagged.type)}</div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{flagged.user.name}</span>
                                <Badge className="bg-red-100 text-red-800">
                                  {flagged.type === "comment"
                                    ? "Commentaire"
                                    : flagged.type === "like"
                                      ? "Like"
                                      : "Partage"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                {flagged.project.title}
                              </p>
                              {flagged.content && (
                                <p className="text-sm bg-white p-2 rounded border">
                                  {flagged.content}
                                </p>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(flagged.timestamp)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleFlagInteraction(flagged.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approuver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteInteraction(flagged.id, flagged.type)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
