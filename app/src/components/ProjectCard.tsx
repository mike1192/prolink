import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Link2, Calendar, Share2, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { Project } from "@/lib/api";
import { toggleLike } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { AvatarBadge } from "./AvatarBadge";
import { CommentsSheet } from "./CommentsSheet";
import { toast } from "sonner";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  const { user, token, openLogin } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [liked, setLiked] = useState(project.liked_by_me);
  const [count, setCount] = useState(project.likes_count);
  const [burst, setBurst] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const handleLike = async () => {
    if (!user || !token) {
      openLogin();
      return;
    }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount((c) => c + (wasLiked ? -1 : 1));
    if (!wasLiked) setBurst((b) => b + 1);
    try {
      await toggleLike(project.id, token);
      // Invalidate ALL project-related queries for real-time sync across all pages
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["userProjects"] });
      qc.invalidateQueries({ queryKey: ["search"] });
    } catch {
      setLiked(wasLiked);
      setCount((c) => c + (wasLiked ? 1 : -1));
      toast.error("Impossible d'enregistrer le like");
    }
  };

  const handleJoin = () => {
    if (!user) return openLogin();
    toast.success("Demande envoyée à l'équipe ✨");
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/u/${ownerUsername}`;
    const text = `Découvre ce projet : ${project.title}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: project.title, text, url });
        toast.success("Publication partagée !");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          fallbackCopy(url);
        }
      }
    } else {
      fallbackCopy(url);
    }
  };

  const fallbackCopy = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Lien copié dans le presse-papiers !");
      })
      .catch(() => {
        toast.error("Impossible de copier le lien");
      });
  };

  const handleGoToChat = () => {
    if (!user) return openLogin();
    if (!project.owner?.id) {
      toast.error("Utilisateur non disponible");
      return;
    }
    // Navigate to chat and automatically select this user
    navigate({ to: "/chat", search: { userId: project.owner.id } });
    toast.info(`Chat ouvert avec ${ownerName}`);
  };

  const ownerName = project.owner?.display_name || project.owner?.username || "Anonyme";
  const ownerUsername = project.owner?.username;
  const [showFullText, setShowFullText] = useState(false);
  const shouldTruncate = project.description.length > 200;
  const displayDescription =
    showFullText || !shouldTruncate
      ? project.description
      : project.description.slice(0, 200) + "...";

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      className="glass group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_-15px_var(--primary)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
        style={{ background: "var(--gradient-primary)" }}
      />

      {/* Header - Like Facebook/LinkedIn */}
      <header className="flex items-start gap-3 p-5 pb-4">
        {ownerUsername ? (
          <Link to="/u/$username" params={{ username: ownerUsername }} className="shrink-0">
            <AvatarBadge name={ownerName} url={project.owner?.avatar_url} />
          </Link>
        ) : (
          <AvatarBadge name={ownerName} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            {ownerUsername ? (
              <Link
                to="/u/$username"
                params={{ username: ownerUsername }}
                className="truncate font-semibold hover:text-primary"
              >
                {ownerName}
              </Link>
            ) : (
              <span className="truncate font-semibold">{ownerName}</span>
            )}
            {ownerUsername && (
              <span className="truncate text-xs text-muted-foreground">@{ownerUsername}</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {timeAgo(project.created_at)}
            {project.project_type && (
              <>
                <span>·</span>
                <span className="text-neon">{project.project_type}</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content - Facebook/LinkedIn Style */}
      <div className="px-5 pb-4">
        {/* Title */}
        <h3 className="text-xl font-bold leading-tight mb-2">{project.title}</h3>

        {/* Description with See More */}
        <div className="relative">
          <p className="text-sm leading-relaxed text-muted-foreground">{displayDescription}</p>
          {shouldTruncate && !showFullText && (
            <button
              onClick={() => setShowFullText(true)}
              className="text-sm font-semibold text-primary hover:underline mt-1"
            >
              Voir plus
            </button>
          )}
          {showFullText && (
            <button
              onClick={() => setShowFullText(false)}
              className="text-sm font-semibold text-primary hover:underline mt-1"
            >
              Voir moins
            </button>
          )}
        </div>

        {/* Skills Tags */}
        {project.skills_needed?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {project.skills_needed.map((s) => (
              <Badge
                key={s}
                variant="outline"
                className="border-primary/30 bg-primary/10 text-primary"
              >
                {s}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Images Section - Always Visible, Facebook Style */}
      {project.images && project.images.length > 0 && (
        <div className="border-t border-border/50">
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
                    {/* Show +X overlay on 4th image if more than 4 */}
                    {idx === 3 && images.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">+{images.length - 3}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Actions */}
      <footer className="mt-5 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-1">
          <button
            onClick={handleLike}
            aria-label="Aimer"
            className="relative flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors hover:bg-pink/10"
          >
            <motion.span
              key={liked ? "on" : "off"}
              animate={liked ? { scale: [1, 0.8, 1.4, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Heart
                className={`h-5 w-5 transition-colors ${liked ? "fill-pink text-pink" : "text-muted-foreground"}`}
              />
            </motion.span>
            <span className={liked ? "text-pink" : "text-muted-foreground"}>{count}</span>

            {/* Heart burst */}
            <AnimatePresence>
              {burst > 0 && (
                <motion.div
                  key={burst}
                  className="pointer-events-none absolute inset-0"
                  onAnimationComplete={() => setBurst(0)}
                >
                  {Array.from({ length: 6 }).map((_, i) => {
                    const angle = (i / 6) * Math.PI * 2;
                    return (
                      <motion.span
                        key={i}
                        className="absolute left-1/2 top-1/2"
                        initial={{ opacity: 1, x: 0, y: 0, scale: 0.8 }}
                        animate={{
                          opacity: 0,
                          x: Math.cos(angle) * 38,
                          y: Math.sin(angle) * 38,
                          scale: 1.2,
                        }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                      >
                        <Heart className="h-3 w-3 fill-pink text-pink" />
                      </motion.span>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={() => setCommentsOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-neon/10 hover:text-neon"
          >
            <MessageCircle className="h-5 w-5" />
            {project.comments_count}
          </button>

          <button
            onClick={handleShare}
            className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            aria-label="Partager"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGoToChat}
            className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
            aria-label="Aller au chat"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Chat</span>
          </button>

          <button
            onClick={handleJoin}
            className="gradient-bg-primary flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-primary-foreground transition-all hover:scale-105 hover:brightness-110"
          >
            <Link2 className="h-4 w-4" />
            Rejoindre
          </button>
        </div>
      </footer>

      <CommentsSheet
        projectId={project.id}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        projectTitle={project.title}
      />
    </motion.article>
  );
}
