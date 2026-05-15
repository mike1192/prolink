import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import { Header } from "@/components/Header";
import { ProjectCard } from "@/components/ProjectCard";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { fetchFeed, searchProjectsBySkill } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Sparkles, Users, Rocket, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [{ title: "ProjectLink — Le feed des projets qui cherchent leur team" }],
  }),
});

function Index() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "trending">("newest");
  const [filterType, setFilterType] = useState<string>("all");

  // All hooks must be called before any conditional returns
  const { data: projects, isLoading } = useQuery({
    queryKey: activeSkill ? ["search", activeSkill, user?.id ?? null] : ["feed", user?.id ?? null],
    queryFn: () =>
      activeSkill
        ? searchProjectsBySkill(activeSkill, user?.id ?? null)
        : fetchFeed(user?.id ?? null),
    enabled: !loading,
    // Refresh every 5 seconds for real-time likes sync
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  // Filter and sort projects
  const getFilteredAndSortedProjects = () => {
    if (!projects) return [];

    let filtered = [...projects];

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter((p) => p.project_type === filterType);
    }

    // Apply sorting
    switch (sortBy) {
      case "popular":
        filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        break;
      case "trending":
        filtered.sort((a, b) => {
          const scoreA = (a.likes_count || 0) * 2 + (a.comments_count || 0);
          const scoreB = (b.likes_count || 0) * 2 + (b.comments_count || 0);
          return scoreB - scoreA;
        });
        break;
      case "newest":
      default:
        filtered.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
    }

    return filtered;
  };

  const filteredProjects = getFilteredAndSortedProjects();

  const popularSkills = [
    "React",
    "TypeScript",
    "Node.js",
    "Python",
    "Design",
    "Mobile",
    "Backend",
    "Frontend",
    "DevOps",
    "AI",
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveSkill(searchQuery.trim());
    }
  };

  const handleSkillClick = (skill: string) => {
    setActiveSkill(skill);
    setSearchQuery(skill);
  };

  const clearSearch = () => {
    setActiveSkill(null);
    setSearchQuery("");
  };

  // Rediriger vers la page d'auth si pas connecté
  if (!loading && !user) {
    return <Navigate to="/auth" />;
  }

  // Afficher un loading pendant la vérification
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="gradient-bg-primary mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl glow">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass relative mb-8 overflow-hidden rounded-3xl p-6 sm:p-8"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full opacity-40 blur-3xl"
            style={{ background: "var(--gradient-primary)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full opacity-30 blur-3xl"
            style={{ background: "var(--gradient-neon)" }}
          />
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              Bienvenue sur ProjectLink
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tes projets méritent <span className="gradient-text">une équipe</span>.
            </h1>
            <p className="mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
              Publie ton idée, découvre des opportunités, connecte-toi avec des bâtisseurs comme
              toi.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <NewProjectDialog />
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-neon" /> Communauté active
                </span>
                <span className="flex items-center gap-1.5">
                  <Rocket className="h-3.5 w-3.5 text-pink" /> 100% gratuit
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Search Bar */}
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6 space-y-3"
        >
          {/* Search Input */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher par compétence (ex: React, Python, Design...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass h-12 rounded-full border-border/50 pl-10 pr-12 text-sm focus-visible:ring-primary/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          {/* Popular Skills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Populaire:</span>
            {popularSkills.map((skill) => (
              <Badge
                key={skill}
                variant={activeSkill === skill ? "default" : "outline"}
                className={`cursor-pointer text-xs transition-all hover:scale-105 ${
                  activeSkill === skill
                    ? "gradient-bg-primary text-primary-foreground"
                    : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                }`}
                onClick={() => handleSkillClick(skill)}
              >
                {skill}
              </Badge>
            ))}
          </div>

          {/* Filters and Sorting */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Filtrer:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="glass rounded-lg border-border/50 px-3 py-1.5 text-xs focus-visible:ring-primary/50 bg-transparent"
              >
                <option value="all">Tous les types</option>
                <option value="web">Web</option>
                <option value="mobile">Mobile</option>
                <option value="desktop">Desktop</option>
                <option value="api">API / Backend</option>
                <option value="design">Design</option>
                <option value="other">Autre</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Trier:</span>
              <div className="flex gap-1">
                {(
                  [
                    ["newest", "Nouveautés"],
                    ["popular", "Populaires"],
                    ["trending", "Tendances"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setSortBy(value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      sortBy === value
                        ? "gradient-bg-primary text-primary-foreground"
                        : "border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Search Indicator */}
          {activeSkill && (
            <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2">
              <Search className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">
                Recherche: <span className="font-semibold">{activeSkill}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                ({projects?.length || 0} projet{projects?.length !== 1 ? "s" : ""})
              </span>
              <button
                onClick={clearSearch}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              >
                Effacer
              </button>
            </div>
          )}
        </motion.section>

        {/* Feed */}
        <section className="space-y-4">
          {isLoading && (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className="glass h-56 animate-pulse rounded-2xl" />
              ))}
            </>
          )}

          {!isLoading && filteredProjects && filteredProjects.length === 0 && (
            <div className="glass rounded-2xl p-10 text-center">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-primary" />
              {activeSkill ? (
                <>
                  <p className="font-semibold">Aucun projet trouvé pour "{activeSkill}"</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Essayez avec une autre compétence ou explorez tous les projets.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Essayez avec une autre compétence ou explorez tous les projets.
                  </p>
                  <div className="mt-5 flex justify-center gap-3">
                    <button
                      onClick={clearSearch}
                      className="gradient-bg-primary rounded-full px-6 py-2 text-sm font-semibold text-primary-foreground transition-all hover:scale-105"
                    >
                      Voir tous les projets
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-semibold">Aucun projet trouvé</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Essayez de modifier vos filtres ou créez un nouveau projet.
                  </p>
                  <div className="mt-5 flex justify-center">
                    <NewProjectDialog />
                  </div>
                </>
              )}
            </div>
          )}

          {filteredProjects?.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </section>
      </main>
    </div>
  );
}
