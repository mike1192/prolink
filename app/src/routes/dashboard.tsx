import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import { fetchUserProjects, fetchFeed } from "@/lib/api";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Star,
  Eye,
  Heart,
  MessageSquare,
  Rocket,
  Target,
  Award,
  Clock,
  ChevronRight,
  Zap,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { ConnectionSuggestions } from "@/components/ConnectionSuggestions";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [{ title: "Dashboard — ProjectLink" }],
  }),
});

function Dashboard() {
  const { user, loading } = useAuth();

  const { data: projects = [], refetch: refetchProjects } = useQuery({
    queryKey: ["userProjects", user?.id],
    queryFn: () => (user?.id ? fetchUserProjects(user.id) : []),
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  });

  const { data: feed = [], refetch: refetchFeed } = useQuery({
    queryKey: ["feed", user?.id],
    queryFn: () => fetchFeed(user?.id ?? null),
    refetchInterval: 15000, // Refresh feed every 15 seconds
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

  // Calculer les vraies statistiques en temps réel
  const totalLikes = projects.reduce((sum, p) => sum + (p.likes_count || 0), 0);
  const totalComments = projects.reduce((sum, p) => sum + (p.comments_count || 0), 0);
  const totalSkills = new Set(projects.flatMap((p) => p.skills_needed || [])).size;

  // Projets récents (7 derniers jours)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentProjects = projects.filter((p) => new Date(p.created_at) >= sevenDaysAgo).length;

  // Projets récents (24 heures)
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
  const todayProjects = projects.filter((p) => new Date(p.created_at) >= twentyFourHoursAgo).length;

  // Taux d'engagement moyen
  const avgEngagement =
    projects.length > 0 ? Math.round((totalLikes + totalComments) / projects.length) : 0;

  // Engagement total (likes + comments)
  const totalEngagement = totalLikes + totalComments;

  // Suggestions de collaboration (projets populaires du feed)
  const trendingProjects = feed
    .filter((p) => p.owner_id !== user?.id)
    .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    .slice(0, 3);

  // Compétences les plus demandées
  const skillCount: Record<string, number> = {};
  projects.forEach((p) => {
    (p.skills_needed || []).forEach((skill) => {
      skillCount[skill] = (skillCount[skill] || 0) + 1;
    });
  });
  const topSkills = Object.entries(skillCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Bienvenue, {user?.display_name || user?.username} ! Voici un aperçu de votre activité.
          </p>
        </motion.div>

        {/* Stats Grid - Mobile: 2x2, Desktop: 4 colonnes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            {
              icon: Rocket,
              label: "Projets",
              value: projects.length,
              color: "text-primary",
              bg: "bg-primary/10",
              trend:
                todayProjects > 0 ? `+${todayProjects} aujourd'hui` : `+${recentProjects} sem.`,
              trendColor: todayProjects > 0 ? "text-green-500" : "text-primary",
            },
            {
              icon: Heart,
              label: "Likes",
              value: totalLikes,
              color: "text-pink",
              bg: "bg-pink/10",
              trend: `${projects.length > 0 ? Math.round(totalLikes / projects.length) : 0} moy.`,
              trendColor: "text-pink",
            },
            {
              icon: MessageSquare,
              label: "Commentaires",
              value: totalComments,
              color: "text-neon",
              bg: "bg-neon/10",
              trend: `${totalEngagement} engag. total`,
              trendColor: "text-neon",
            },
            {
              icon: Target,
              label: "Compétences",
              value: totalSkills,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
              trend: topSkills.length > 0 ? topSkills[0][0] : "N/A",
              trendColor: "text-blue-500",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
              onClick={() => {
                // Manual refresh on click
                refetchProjects();
                refetchFeed();
              }}
              title="Cliquez pour actualiser"
            >
              {/* Pulsing indicator for real-time */}
              <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />

              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <TrendingUp className={`h-3 w-3 ${stat.trendColor}`} />
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
              <div className={`text-[10px] truncate ${stat.trendColor}`}>{stat.trend}</div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions - Mobile: scroll horizontal, Desktop: grid */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-4 mb-8"
        >
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Actions rapides
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
            <div className="flex-shrink-0 lg:flex-shrink">
              <NewProjectDialog />
            </div>
            <Link to="/" className="flex-shrink-0 lg:flex-shrink">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <Users className="h-4 w-4 mr-2" />
                Explorer
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 whitespace-nowrap lg:flex-shrink"
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Sauvegardés
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 whitespace-nowrap lg:flex-shrink"
            >
              <Award className="h-4 w-4 mr-2" />
              Compétences
            </Button>
          </div>
        </motion.section>

        {/* Main Content - Mobile: stack vertical, Desktop: 2 colonnes */}
        <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:mb-8">
          {/* Recent Projects - Mobile: pleine largeur */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-4 lg:col-span-2 lg:p-6"
          >
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h2 className="text-base lg:text-xl font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                <span className="truncate">Mes projets récents</span>
              </h2>
              <div className="flex-shrink-0 ml-2">
                <NewProjectDialog />
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-8 lg:py-12">
                <LayoutDashboard className="h-12 w-12 lg:h-16 lg:w-16 mx-auto mb-3 lg:mb-4 text-muted-foreground opacity-50" />
                <p className="text-base lg:text-lg font-semibold mb-2">
                  Aucun projet pour le moment
                </p>
                <p className="text-xs lg:text-sm text-muted-foreground mb-4">
                  Créez votre premier projet et commencez à collaborer !
                </p>
                <NewProjectDialog />
              </div>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-border/50 p-3 lg:p-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold lg:font-bold text-sm lg:text-base group-hover:text-primary transition-colors line-clamp-1">
                        {p.title}
                      </h3>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
                    </div>
                    <p className="text-xs lg:text-sm text-muted-foreground line-clamp-2 mb-2 lg:mb-3">
                      {p.description}
                    </p>
                    <div className="flex items-center gap-3 lg:gap-4 text-[10px] lg:text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {p.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {p.comments_count || 0}
                      </span>
                      {p.skills_needed && p.skills_needed.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {p.skills_needed.length} compétences
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {projects.length > 5 && (
                  <Link
                    to="/u/$username"
                    params={{ username: user?.username || "" }}
                    className="block text-center text-xs lg:text-sm text-primary hover:underline mt-4"
                  >
                    Voir tous mes projets ({projects.length})
                  </Link>
                )}
              </div>
            )}
          </motion.section>

          {/* Sidebar - Mobile: en dessous */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4 lg:space-y-6"
          >
            {/* Connection Suggestions */}
            <ConnectionSuggestions />

            {/* Top Skills */}
            <div className="glass rounded-2xl p-4 lg:p-6">
              <h3 className="text-base lg:text-lg font-bold mb-3 lg:mb-4 flex items-center gap-2">
                <Award className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                Compétences recherchées
              </h3>
              {topSkills.length > 0 ? (
                <div className="space-y-3">
                  {topSkills.map(([skill, count], idx) => (
                    <div key={skill} className="flex items-center gap-2 lg:gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs lg:text-sm font-medium truncate">{skill}</span>
                          <span className="text-[10px] lg:text-xs text-muted-foreground flex-shrink-0 ml-2">
                            {count} projet{count > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="h-1.5 lg:h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(count / topSkills[0][1]) * 100}%`,
                            }}
                            transition={{ delay: 0.8 + idx * 0.1, duration: 0.5 }}
                            className="h-full gradient-bg-primary"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs lg:text-sm text-muted-foreground text-center py-3 lg:py-4">
                  Aucune compétence pour le moment
                </p>
              )}
            </div>

            {/* Trending Projects */}
            <div className="glass rounded-2xl p-4 lg:p-6">
              <h3 className="text-base lg:text-lg font-bold mb-3 lg:mb-4 flex items-center gap-2">
                <Star className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-500" />
                Tendances
              </h3>
              {trendingProjects.length > 0 ? (
                <div className="space-y-2 lg:space-y-3">
                  {trendingProjects.map((project, idx) => (
                    <Link
                      key={project.id}
                      to="/u/$username"
                      params={{ username: project.owner?.username || "" }}
                      className="block p-2 lg:p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-2 lg:gap-3">
                        <div className="text-xl lg:text-2xl font-bold text-muted-foreground/30 flex-shrink-0">
                          #{idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs lg:text-sm font-semibold truncate">
                            {project.title}
                          </h4>
                          <p className="text-[10px] lg:text-xs text-muted-foreground truncate">
                            par {project.owner?.display_name || project.owner?.username}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1 text-[10px] lg:text-xs text-pink">
                              <Heart className="h-3 w-3" />
                              {project.likes_count || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs lg:text-sm text-muted-foreground text-center py-3 lg:py-4">
                  Aucun projet tendance
                </p>
              )}
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
