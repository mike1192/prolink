import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { AvatarBadge } from "@/components/AvatarBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchProfile,
  fetchUserProjects,
  uploadCoverImage,
  uploadAvatarImage,
  toggleLike,
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  checkConnectionStatus,
  fetchConnections,
  fetchMutualConnections,
  type Project,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { EditProjectDialog } from "@/components/EditProjectDialog";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { PortfolioGallery } from "@/components/PortfolioGallery";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MessageSquare,
  Pencil,
  MapPin,
  Link2,
  Building2,
  Users,
  Star,
  Award,
  Briefcase,
  GraduationCap,
  Heart,
  TrendingUp,
  Globe,
  Github,
  Linkedin,
  Twitter,
  Camera,
  Image,
  MoreHorizontal,
  Share2,
  ThumbsUp,
  MessageCircle,
  Send,
  UserPlus,
  UserCheck,
  CheckCircle,
  Bell,
  Flag,
  Link as LinkIcon,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/u/$username")({
  loader: async ({ params }) => {
    const profile = await fetchProfile(params.username);
    if (!profile) throw notFound();
    return { profile };
  },
  component: ProfilePage,
  notFoundComponent: () => (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Profil introuvable</h1>
        <Link to="/" className="mt-4 inline-block text-blue-500 hover:underline">
          Retour au feed
        </Link>
      </div>
    </div>
  ),
});

function ProfilePage() {
  const { profile } = Route.useLoaderData();
  const { user, token, openLogin } = useAuth();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [editingProject, setEditingProject] = useState<{
    id: string;
    title: string;
    description: string;
    skills_needed: string[];
    project_type: string | null;
  } | null>(null);
  const [coverInputKey, setCoverInputKey] = useState(0);
  const [avatarInputKey, setAvatarInputKey] = useState(0);
  const isMe = user?.id === profile.id;

  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<
    "none" | "sent" | "received" | "connected"
  >("none");
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [mutualConnections, setMutualConnections] = useState<
    Array<{ id: string; username: string; display_name: string | null; avatar_url: string | null }>
  >([]);

  // Like state management per project
  const [projectLikes, setProjectLikes] = useState<
    Record<string, { liked: boolean; count: number }>
  >(() => ({}));

  const handleProjectLike = async (
    projectId: string,
    currentLiked: boolean,
    currentCount: number,
  ) => {
    if (!user || !token) {
      openLogin();
      return;
    }

    const newLiked = !currentLiked;
    const newCount = currentCount + (currentLiked ? -1 : 1);

    // Update local state immediately
    setProjectLikes((prev) => ({
      ...prev,
      [projectId]: { liked: newLiked, count: newCount },
    }));

    try {
      await toggleLike(projectId, token);
      // Invalidate all queries for real-time sync
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["userProjects"] });
      qc.invalidateQueries({ queryKey: ["search"] });
    } catch {
      // Revert on error
      setProjectLikes((prev) => ({
        ...prev,
        [projectId]: { liked: currentLiked, count: currentCount },
      }));
      toast.error("Impossible d'enregistrer le like");
    }
  };

  const toggleDescription = (projectId: string) => {
    setExpandedDescriptions((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5MB");
      return;
    }

    try {
      toast.info("Upload de la couverture...");
      const data = await uploadCoverImage(file, token);
      toast.success("Photo de couverture mise à jour !");

      // Mettre à jour le profil avec la nouvelle couverture
      const response = await fetch("http://localhost:3000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          cover_url: data.url,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du profil");
      }

      // Recharger les données du profil
      window.location.reload();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Impossible de modifier la couverture");
    }

    // Reset input
    setCoverInputKey((prev) => prev + 1);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5MB");
      return;
    }

    try {
      toast.info("Upload de l'avatar...");
      const data = await uploadAvatarImage(file, token);
      toast.success("Photo de profil mise à jour !");

      // Mettre à jour le profil avec le nouvel avatar
      const response = await fetch("http://localhost:3000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          avatar_url: data.url,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du profil");
      }

      // Recharger les données du profil
      window.location.reload();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Impossible de modifier la photo de profil",
      );
    }

    // Reset input
    setAvatarInputKey((prev) => prev + 1);
  };

  const { data: projects = [], refetch } = useQuery({
    queryKey: ["userProjects", profile.id],
    queryFn: () => fetchUserProjects(profile.id),
    // Refresh every 5 seconds for real-time likes sync
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  // Load connection status
  useEffect(() => {
    if (!isMe && user && token) {
      checkConnectionStatus(profile.id, token)
        .then((data) => {
          setConnectionStatus(data.status);
          setConnectionId(data.connection_id || null);
        })
        .catch(() => {});

      // Load connections count
      fetchConnections(profile.id)
        .then((conns) => setConnectionsCount(conns.length))
        .catch(() => {});

      // Load mutual connections
      fetchMutualConnections(profile.id, token)
        .then((mutual) => setMutualConnections(mutual))
        .catch(() => {});
    }
  }, [profile.id, user, token, isMe]);

  // We also need to pass current user ID to get liked_by_me status
  // Let's create a custom fetch that includes user ID
  const { data: projectsWithLikes = [], refetch: refetchWithLikes } = useQuery({
    queryKey: ["userProjects", profile.id, user?.id],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:3000/api/projects/user/${profile.id}?user_id=${user?.id || ""}`,
      );
      if (!response.ok) throw new Error("Erreur");
      return response.json();
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  // Use projectsWithLikes if available, otherwise fallback to projects
  const displayProjects = projectsWithLikes.length > 0 ? projectsWithLikes : projects;

  const handleDeleteProject = async (projectId: string, projectTitle: string) => {
    if (!token) return;

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le projet "${projectTitle}" ?`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:3000/api/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast.success("Projet supprimé avec succès");
      refetch();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible de supprimer le projet");
    }
  };

  const handleEditProject = (project: {
    id: string;
    title: string;
    description: string;
    skills_needed: string[];
    project_type: string | null;
  }) => {
    setEditingProject(project);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Profile Header - LinkedIn/Facebook Style */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass relative overflow-hidden rounded-2xl mb-6"
        >
          {/* Cover Photo - LinkedIn Style */}
          <div className="relative h-52 sm:h-64 bg-gradient-to-r from-primary/80 via-neon/60 to-pink/70">
            {profile.cover_url ? (
              <img
                src={profile.cover_url}
                alt="Cover"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            ) : (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `radial-gradient(circle at 20% 50%, var(--gradient-primary) 0%, transparent 50%),
                                  radial-gradient(circle at 80% 80%, var(--gradient-neon) 0%, transparent 50%)`,
                }}
              />
            )}
            {isMe && (
              <>
                <input
                  key={coverInputKey}
                  type="file"
                  id="cover-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                />
                <label
                  htmlFor="cover-upload"
                  className="absolute bottom-4 right-4 glass px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/20 transition-all cursor-pointer z-10 pointer-events-auto"
                >
                  <Camera className="h-4 w-4" />
                  <span className="text-sm font-medium">Modifier la couverture</span>
                </label>
              </>
            )}
          </div>

          {/* Profile Info - Facebook/LinkedIn Style */}
          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start gap-4 -mt-16 sm:-mt-20">
              {/* Avatar - Facebook Style */}
              <div className="relative">
                <div className="p-1 bg-background rounded-full shadow-xl">
                  <AvatarBadge
                    name={profile.display_name || profile.username}
                    url={profile.avatar_url}
                    size="xl"
                  />
                </div>
                {isMe && (
                  <>
                    <input
                      key={avatarInputKey}
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-2 right-2 p-2 rounded-full gradient-bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-all cursor-pointer z-10"
                    >
                      <Camera className="h-4 w-4" />
                    </label>
                  </>
                )}
              </div>

              {/* Name & Actions - LinkedIn Style */}
              <div className="flex-1 mt-4 sm:mt-12 px-4 sm:px-0">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold break-words whitespace-normal">
                    {profile.display_name || profile.username}
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground mt-1 break-words">
                    @{profile.username}
                  </p>
                  {profile.bio && (
                    <div className="mt-2 text-sm max-w-2xl break-words whitespace-normal">
                      <MarkdownRenderer content={profile.bio} />
                    </div>
                  )}

                  {/* Availability Badge */}
                  {profile.availability_status && (
                    <div className="mt-3">
                      {profile.availability_status === "ouvert" && (
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ouvert aux opportunités
                        </Badge>
                      )}
                      {profile.availability_status === "projets_uniquement" && (
                        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                          <Briefcase className="h-3 w-3 mr-1" />
                          Projets uniquement
                        </Badge>
                      )}
                      {profile.availability_status === "ferme" && (
                        <Badge variant="secondary">
                          Pas disponible
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Verified Skills */}
                  {profile.verified_skills && profile.verified_skills.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Compétences vérifiées :</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.verified_skills.map((skill: string) => (
                          <Badge
                            key={skill}
                            className="bg-green-500/20 text-green-500 border-green-500/30"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Details - LinkedIn Style */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-muted-foreground">
                  {profile.job_title && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Briefcase className="h-4 w-4 flex-shrink-0" />
                      <span className="break-words">{profile.job_title}</span>
                    </div>
                  )}
                  {profile.location && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="break-words">{profile.location}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-4 w-4" />
                      <a
                        href={
                          profile.website.startsWith("http")
                            ? profile.website
                            : `https://${profile.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {profile.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {(profile.github || profile.twitter || profile.linkedin) && (
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {profile.github && (
                      <a
                        href={`https://github.com/${profile.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Github className="h-4 w-4" />
                        <span className="hover:underline">GitHub</span>
                      </a>
                    )}
                    {profile.twitter && (
                      <a
                        href={`https://twitter.com/${profile.twitter.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Twitter className="h-4 w-4" />
                        <span className="hover:underline">Twitter</span>
                      </a>
                    )}
                    {profile.linkedin && (
                      <a
                        href={
                          profile.linkedin.startsWith("http")
                            ? profile.linkedin
                            : `https://linkedin.com/in/${profile.linkedin}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Linkedin className="h-4 w-4" />
                        <span className="hover:underline">LinkedIn</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Stats - Facebook Style */}
                <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <span className="text-sm">
                      <span className="font-bold">{displayProjects.length}</span> projets
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-neon" />
                    <span className="text-sm">
                      <span className="font-bold">{connectionsCount}</span> relations
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm">
                      <span className="font-bold">{profile.skills?.length || 0}</span> compétences
                    </span>
                  </div>
                  {isMe ? (
                    <Button
                      size="sm"
                      className="gradient-bg-primary glow ml-auto"
                      onClick={() => setEditOpen(true)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Éditer le profil
                    </Button>
                  ) : (
                    <div className="flex gap-2 ml-auto">
                      {connectionStatus === "connected" ? (
                        <Button variant="outline" className="glass">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                      ) : connectionStatus === "sent" ? (
                        <Button variant="outline" disabled>
                          Demande envoyée
                        </Button>
                      ) : connectionStatus === "received" ? (
                        <Button
                          variant="default"
                          className="gradient-bg-primary glow"
                          onClick={async () => {
                            if (!token || !connectionId) return;
                            try {
                              await acceptConnectionRequest(connectionId, token);
                              setConnectionStatus("connected");
                              qc.invalidateQueries({ queryKey: ["connections"] });
                              toast.success("Demande acceptée !");
                            } catch {
                              toast.error("Erreur lors de l'acceptation");
                            }
                          }}
                        >
                          Accepter la demande
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          className="gradient-bg-primary glow"
                          onClick={async () => {
                            if (!user || !token) return openLogin();
                            try {
                              await sendConnectionRequest(profile.id, token);
                              setConnectionStatus("sent");
                              toast.success("Demande de connexion envoyée !");
                            } catch (error: any) {
                              toast.error(error.message || "Erreur lors de l'envoi");
                            }
                          }}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Se connecter
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Skills & Info */}
          <div className="space-y-6">
            {/* Skills Section */}
            {profile.skills?.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Compétences</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s: string) => (
                    <Badge
                      key={s}
                      variant="outline"
                      className="border-primary/30 bg-primary/10 text-primary px-3 py-1.5"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Portfolio Gallery */}
            {profile.portfolio_images && profile.portfolio_images.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass rounded-2xl p-4 sm:p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Image className="h-5 w-5 text-primary" />
                  <h2 className="text-lg sm:text-xl font-bold">Portfolio</h2>
                </div>
                <PortfolioGallery images={profile.portfolio_images} isOwner={isMe} />
              </motion.section>
            )}

            {/* Looking For */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-neon" />
                <h2 className="text-xl font-bold">Recherche</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {isMe
                  ? "Définissez ce que vous recherchez pour collaborer"
                  : "Ce que cette personne recherche"}
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span>Collaborateurs pour projets</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-neon" />
                  <span>Projets open source</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-pink" />
                  <span>Networking professionnel</span>
                </div>
              </div>
            </motion.section>

            {/* Activity */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Activité</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Membre depuis</span>
                  <span className="font-medium">
                    {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Projets actifs</span>
                  <span className="font-medium">{displayProjects.length}</span>
                </div>
              </div>
            </motion.section>
          </div>

          {/* Right Column - Projects */}
          <div className="lg:col-span-2">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-4 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Briefcase className="h-5 w-5 text-primary flex-shrink-0" />
                  <h2 className="text-lg sm:text-xl font-bold break-words">
                    Projets ({displayProjects.length})
                  </h2>
                </div>
                {isMe && (
                  <Button size="sm" className="gradient-bg-primary glow whitespace-nowrap flex-shrink-0">
                    <Briefcase className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Nouveau projet</span>
                    <span className="sm:hidden">Nouveau</span>
                  </Button>
                )}
              </div>

              {displayProjects.length === 0 ? (
                <div className="text-center py-8 sm:py-12 px-4">
                  <Briefcase className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
                  <p className="text-base sm:text-lg font-semibold mb-2">Aucun projet publié</p>
                  <p className="text-xs sm:text-sm text-muted-foreground px-2">
                    {isMe
                      ? "Créez votre premier projet et trouvez des collaborateurs"
                      : `${profile.display_name || profile.username} n'a pas encore publié de projets`}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {displayProjects.map((p: Project) => (
                    <article
                      key={p.id}
                      className="rounded-xl border border-border/50 p-4 sm:p-5 hover:border-primary/50 hover:shadow-lg transition-all"
                    >
                      <h3 className="font-semibold sm:font-bold text-sm sm:text-base mb-2 break-words">{p.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
                        {p.description}
                      </p>
                      {p.skills_needed.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {p.skills_needed.slice(0, 3).map((s: string) => (
                            <Badge
                              key={s}
                              variant="outline"
                              className="border-primary/30 bg-primary/10 text-primary text-xs"
                            >
                              {s}
                            </Badge>
                          ))}
                          {p.skills_needed.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{p.skills_needed.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
                        <span className="flex items-center gap-1 min-w-0">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="break-words">
                            {new Date(p.created_at).toLocaleDateString("fr-FR")}
                          </span>
                        </span>
                        <span className="text-neon text-xs break-words">{p.project_type || "Projet"}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </motion.section>

            {/* Activity/Posts Section - Projets dynamiques */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Publications ({displayProjects.length})</h2>
                </div>
                {isMe && <NewProjectDialog />}
              </div>

              {displayProjects.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                  <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-semibold mb-2">Aucune publication</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    {isMe
                      ? "Commencez par créer votre premier projet"
                      : `${profile.display_name || profile.username} n'a pas encore publié de projets`}
                  </p>
                  {isMe && <NewProjectDialog />}
                </div>
              ) : (
                <div className="space-y-4">
                  {displayProjects.map((project: Project, index: number) => (
                    <motion.article
                      key={project.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
                      className="glass group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_-15px_var(--primary)]"
                    >
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
                        style={{ background: "var(--gradient-primary)" }}
                      />

                      {/* Header */}
                      <header className="flex items-start gap-3">
                        <AvatarBadge name={profile.display_name || profile.username} size="md" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="truncate font-semibold">
                              {profile.display_name || profile.username}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(project.created_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            {project.project_type && (
                              <>
                                <span>·</span>
                                <span className="text-neon">{project.project_type}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Menu actions - Only for owner */}
                        {isMe && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                handleEditProject({
                                  id: project.id,
                                  title: project.title,
                                  description: project.description,
                                  skills_needed: project.skills_needed,
                                  project_type: project.project_type,
                                })
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                              aria-label="Modifier"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project.id, project.title)}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                              aria-label="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </header>

                      {/* Body */}
                      <div className="mt-4 space-y-3">
                        <h3 className="text-lg sm:text-xl font-bold leading-tight break-words">{project.title}</h3>
                        <div className="relative">
                          <p className="text-sm leading-relaxed text-muted-foreground break-words">
                            {expandedDescriptions.has(project.id) ||
                            project.description.length <= 200
                              ? project.description
                              : project.description.slice(0, 200) + "..."}
                          </p>
                          {project.description.length > 200 && (
                            <button
                              onClick={() => toggleDescription(project.id)}
                              className="text-sm font-semibold text-primary hover:underline mt-1"
                            >
                              {expandedDescriptions.has(project.id) ? "Voir moins" : "Voir plus"}
                            </button>
                          )}
                        </div>

                        {project.skills_needed.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {project.skills_needed.map((skill: string) => (
                              <Badge
                                key={skill}
                                variant="outline"
                                className="border-primary/30 bg-primary/10 text-primary"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Images - Facebook Style */}
                        {project.images && project.images.length > 0 && (
                          <div className="border-t border-border/50 -mx-5 pt-4">
                            {(() => {
                              const images = project.images!;
                              return (
                                <div
                                  className={`grid ${
                                    images.length === 1
                                      ? "grid-cols-1"
                                      : images.length === 2
                                        ? "grid-cols-2"
                                        : images.length === 3
                                          ? "grid-cols-3"
                                          : "grid-cols-2"
                                  }`}
                                >
                                  {images.slice(0, 4).map((img: string, idx: number) => (
                                    <div
                                      key={idx}
                                      className={`relative overflow-hidden bg-muted ${
                                        images.length === 1
                                          ? "aspect-video"
                                          : idx === 3 && images.length > 4
                                            ? "relative"
                                            : "aspect-square"
                                      }`}
                                    >
                                      <img
                                        src={img}
                                        alt={`${project.title} - Image ${idx + 1}`}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        loading="lazy"
                                      />
                                      {idx === 3 && images.length > 4 && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                          <span className="text-white text-2xl font-bold">
                                            +{images.length - 3}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <footer className="mt-5 flex items-center justify-between border-t border-border pt-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const likeState = projectLikes[project.id] || {
                                liked: project.liked_by_me || false,
                                count: project.likes_count || 0,
                              };
                              handleProjectLike(project.id, likeState.liked, likeState.count);
                            }}
                            className="relative flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors hover:bg-pink/10"
                          >
                            {(() => {
                              const likeState = projectLikes[project.id] || {
                                liked: project.liked_by_me || false,
                                count: project.likes_count || 0,
                              };
                              return (
                                <>
                                  <Heart
                                    className={`h-5 w-5 transition-colors ${
                                      likeState.liked
                                        ? "fill-pink text-pink"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                  <span
                                    className={
                                      likeState.liked ? "text-pink" : "text-muted-foreground"
                                    }
                                  >
                                    {likeState.count}
                                  </span>
                                </>
                              );
                            })()}
                          </button>

                          <button className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-neon/10 hover:text-neon">
                            <MessageCircle className="h-5 w-5" />
                            {project.comments_count || 0}
                          </button>

                          <button
                            className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                            aria-label="Partager"
                          >
                            <Share2 className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isMe && (
                            <>
                              <button className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent">
                                <MessageSquare className="h-4 w-4" />
                                <span className="hidden sm:inline">Chat</span>
                              </button>

                              <button className="gradient-bg-primary flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-primary-foreground transition-all hover:scale-105 hover:brightness-110">
                                <Link2 className="h-4 w-4" />
                                Rejoindre
                              </button>
                            </>
                          )}
                        </div>
                      </footer>
                    </motion.article>
                  ))}
                </div>
              )}
            </motion.section>
          </div>
        </div>

        {isMe && <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} profile={profile} />}

        <EditProjectDialog
          project={editingProject}
          open={editingProject !== null}
          onOpenChange={(open) => {
            if (!open) setEditingProject(null);
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      </main>
    </div>
  );
}
