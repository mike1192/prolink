import { useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Heart, MessageSquare, Search, Sparkles, Trash2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { exportRowsAsCSV } from "@/lib/csv";
import { useProjects } from "@/hooks/useRealTimeData";
import { useProjectActions } from "../../hooks/useAdminActions";
import { useQueryClient } from "@tanstack/react-query";

export default function Projects() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "popular" | "recent" | "flagged" | "featured">("all");
  const queryClient = useQueryClient();
  
  const { data: projectsData, isLoading, error } = useProjects();
  const { featureProject, deleteProject } = useProjectActions();
  const projects = projectsData || [];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const handleFeatureProject = (projectId: string, projectTitle: string) => {
    if (confirm(`Mettre en avant le projet "${projectTitle}" ?`)) {
      featureProject.mutate(projectId);
    }
  };

  const handleDeleteProject = (projectId: string, projectTitle: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le projet "${projectTitle}" ? Cette action est irréversible.`)) {
      deleteProject.mutate(projectId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const list = useMemo(() => {
    let arr = [...projects];
    if (filter === "popular") arr.sort((a,b) => (b.likes_count || 0) - (a.likes_count || 0));
    if (filter === "recent") arr.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    // Pour l'instant, pas de système de flagged/featured dans la DB
    if (filter === "flagged") arr = [];
    if (filter === "featured") arr = [];
    return arr.filter(p => p.title.toLowerCase().includes(q.toLowerCase()));
  }, [q, filter, projects]);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Projets" subtitle="Erreur lors du chargement" />
        <div className="text-center py-8">
          <p className="text-muted-foreground">Erreur lors du chargement des projets</p>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projets"
        subtitle={isLoading ? "Chargement..." : `${projects.length} projets sur la plateforme`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                exportRowsAsCSV(`projects-${new Date().toISOString().slice(0, 10)}.csv`, list, [
                  "id", "title", "owner_name", "project_type", "likes_count", "comments_count", "created_at"
                ]);
                toast.success(`${list.length} projets exportés`);
              }}
              disabled={isLoading}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher un projet…" className="pl-9" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all","popular","recent","featured","flagged"] as const).map(f => (
            <Button key={f} variant={filter===f?"default":"outline"} size="sm"
              onClick={() => setFilter(f)}
              className={filter===f?"gradient-primary text-primary-foreground border-0":""}>
              {f === "all" ? "Tous" : f === "popular" ? "Populaires" : f === "recent" ? "Récents" : f === "featured" ? "Featured" : "Signalés"}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Chargement des projets...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">
              {q ? "Aucun projet trouvé pour cette recherche" : "Aucun projet disponible"}
            </p>
          </div>
        ) : (
          list.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -3 }}
              className="group relative rounded-xl border border-border bg-card card-shadow p-5 overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display font-bold truncate">{p.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    par {p.owner_name || p.owner_username || 'Utilisateur'} · {p.project_type || 'Projet'}
                  </p>
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {p.description}
                    </p>
                  )}
                  {p.skills_needed && p.skills_needed.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {p.skills_needed.slice(0, 3).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-[9px] py-0 px-1.5 border-primary/30 text-primary">
                          {skill}
                        </Badge>
                      ))}
                      {p.skills_needed.length > 3 && (
                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-muted/30 text-muted-foreground">
                          +{p.skills_needed.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] border-success/40 text-success">
                  Publié
                </Badge>
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5 text-neon-pink" /> 
                  {(p.likes_count || 0).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5 text-neon-blue" /> 
                  {p.comments_count || 0}
                </span>
                <span className="ml-auto font-mono text-[10px]">
                  {formatDate(p.created_at)}
                </span>
              </div>

              <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 text-xs" 
                  onClick={() => handleFeatureProject(p.id, p.title)}
                  disabled={featureProject.isPending}
                >
                  <Sparkles className="h-3 w-3 mr-1" /> Featured
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-destructive border-destructive/30 hover:bg-destructive/10" 
                  onClick={() => handleDeleteProject(p.id, p.title)}
                  disabled={deleteProject.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
