import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addComment, fetchComments, updateComment, deleteComment } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AvatarBadge } from "./AvatarBadge";
import { Send, Reply, Edit2, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import type { Comment } from "@/lib/api";

interface Props {
  projectId: string;
  projectTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommentsSheet({ projectId, projectTitle, open, onOpenChange }: Props) {
  const { user, token, openLogin } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", projectId],
    queryFn: () => fetchComments(projectId),
    enabled: open,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return openLogin();
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > 500) {
      toast.error("Commentaire trop long (max 500 caractères)");
      return;
    }
    setSending(true);
    try {
      await addComment(projectId, trimmed, token);
      setText("");
      // Refresh comments immediately
      await qc.invalidateQueries({ queryKey: ["comments", projectId] });
      // Refresh feed to update comment counts
      await qc.invalidateQueries({ queryKey: ["feed"] });
      await qc.invalidateQueries({ queryKey: ["userProjects"] });
      toast.success("Commentaire ajouté");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!user || !token) return openLogin();
    const trimmed = replyText.trim();
    if (!trimmed) return;
    if (trimmed.length > 500) {
      toast.error("Réponse trop longue (max 500 caractères)");
      return;
    }
    try {
      await addComment(projectId, trimmed, token, parentId);
      setReplyText("");
      setReplyingTo(null);
      // Refresh comments immediately
      await qc.invalidateQueries({ queryKey: ["comments", projectId] });
      // Refresh feed to update comment counts
      await qc.invalidateQueries({ queryKey: ["feed"] });
      await qc.invalidateQueries({ queryKey: ["userProjects"] });
      toast.success("Réponse ajoutée");
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Erreur lors de l'envoi");
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!token) return;
    const trimmed = editText.trim();
    if (!trimmed) return;
    try {
      await updateComment(commentId, trimmed, token);
      setEditingComment(null);
      setEditText("");
      await qc.invalidateQueries({ queryKey: ["comments", projectId] });
      toast.success("Commentaire modifié");
    } catch (error) {
      console.error("Error editing comment:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!token) return;
    if (!confirm("Supprimer ce commentaire ?")) return;
    try {
      await deleteComment(commentId, token);
      await qc.invalidateQueries({ queryKey: ["comments", projectId] });
      // Refresh feed to update comment counts
      await qc.invalidateQueries({ queryKey: ["feed"] });
      await qc.invalidateQueries({ queryKey: ["userProjects"] });
      toast.success("Commentaire supprimé");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // Organiser les commentaires : principaux et réponses
  const parentComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

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

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwner = user?.id === comment.user_id;
    const isEditing = editingComment === comment.id;
    const isReplying = replyingTo === comment.id;
    const replies = getReplies(comment.id);

    return (
      <div key={comment.id} className={`${isReply ? "ml-12 mt-2" : "mb-4"}`}>
        {isReply && (
          <div className="mb-1.5 flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
            <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5">
              <Reply className="h-2.5 w-2.5 text-primary" />
              <span className="text-[10px] font-semibold text-primary">réponse</span>
            </div>
          </div>
        )}
        <div className={`flex gap-3 ${isReply ? "items-start" : ""}`}>
          <AvatarBadge name={comment.author?.display_name || comment.author?.username} size="sm" />
          <div className="min-w-0 flex-1">
            <div
              className={`rounded-2xl ${
                isReply
                  ? "rounded-tl-sm bg-muted/20 px-2.5 py-1.5"
                  : "rounded-tl-sm bg-muted/40 px-3 py-2"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <p className={`${isReply ? "text-xs" : "text-xs font-semibold"}`}>
                    {comment.author?.display_name || comment.author?.username || "Anonyme"}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {comment.updated_at !== comment.created_at ? "(modifié) " : ""}
                    {timeAgo(comment.created_at)}
                  </span>
                </div>
                {!isReply && isOwner && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (isEditing) {
                          setEditingComment(null);
                          setEditText("");
                        } else {
                          setEditingComment(comment.id);
                          setEditText(comment.content);
                        }
                      }}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {isEditing ? <X className="h-3 w-3" /> : <Edit2 className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    maxLength={500}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(comment.id)}
                      disabled={!editText.trim()}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Sauvegarder
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingComment(null);
                        setEditText("");
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <p
                  className={`${isReply ? "mt-0.5 text-xs" : "mt-0.5 text-sm"} text-foreground/90 break-words`}
                >
                  {comment.content}
                </p>
              )}
            </div>

            {!isReply && !isEditing && (
              <button
                onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                className="mt-1.5 flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <Reply className="h-3 w-3" />
                Répondre
              </button>
            )}

            {isReplying && (
              <div className="mt-2 flex gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Répondre à ${comment.author?.display_name || comment.author?.username}...`}
                  maxLength={500}
                  className="border-0 bg-background text-sm focus-visible:ring-0"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={() => handleReply(comment.id)}
                  disabled={!replyText.trim()}
                >
                  <Send className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText("");
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Afficher les réponses */}
        {!isReply && replies.length > 0 && (
          <div className="mt-3 ml-4 border-l-2 border-primary/20 pl-4">
            {replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="glass flex w-full flex-col p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="truncate">{projectTitle}</SheetTitle>
          <p className="text-sm text-muted-foreground">{comments.length} commentaire(s)</p>
        </SheetHeader>

        <div className="scrollbar-thin flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
              ))}
            </div>
          ) : parentComments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Sois le premier à commenter ✨
            </p>
          ) : (
            <div>{parentComments.map((comment) => renderComment(comment))}</div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-border bg-background/40 p-3">
          <div className="flex items-center gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={user ? "Ton commentaire…" : "Connecte-toi pour commenter"}
              maxLength={500}
              onFocus={() => !user && openLogin()}
            />
            <Button type="submit" size="icon" variant="hero" disabled={sending || !text.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
