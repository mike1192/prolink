import { useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Award, Plus, Pencil, Trash2, UserMinus, History } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useBadges, type Badge as BadgeT } from "@/lib/badges-store";
import { users } from "@/lib/mock-data";

function BadgePill({ b, large = false }: { b: BadgeT; large?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${large ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[10px]"}`}
      style={{ background: `${b.color}22`, color: b.color, border: `1px solid ${b.color}55` }}
    >
      <Award className={large ? "h-3.5 w-3.5" : "h-3 w-3"} />
      {b.name}
    </span>
  );
}

function BadgeForm({ initial, onSubmit, onClose }: { initial?: BadgeT; onSubmit: (v: Omit<BadgeT, "id" | "createdAt">) => void; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [color, setColor] = useState(initial?.color ?? "#a855f7");
  const [icon, setIcon] = useState(initial?.icon ?? "Award");
  return (
    <div className="space-y-4">
      <div><Label className="text-xs">Nom</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Top Contributor" /></div>
      <div><Label className="text-xs">Description</Label><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Couleur</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 rounded border border-border bg-transparent" />
            <Input value={color} onChange={(e) => setColor(e.target.value)} className="font-mono text-xs" />
          </div>
        </div>
        <div><Label className="text-xs">Icône (Lucide)</Label><Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Award" /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button
          className="gradient-primary text-primary-foreground border-0"
          onClick={() => {
            if (!name.trim()) { toast.error("Nom requis"); return; }
            onSubmit({ name, description, color, icon });
            onClose();
          }}
        >
          {initial ? "Mettre à jour" : "Créer"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function Badges() {
  const { badges, assignments, history, createBadge, updateBadge, deleteBadge, assign, revoke } = useBadges();
  const [editing, setEditing] = useState<BadgeT | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignBadgeId, setAssignBadgeId] = useState<string | null>(null);
  const [assignUserId, setAssignUserId] = useState<string>("");

  const totalAssigned = assignments.length;
  const recipientsByBadge = useMemo(() => {
    const map = new Map<string, typeof assignments>();
    assignments.forEach((a) => {
      const arr = map.get(a.badgeId) ?? [];
      arr.push(a);
      map.set(a.badgeId, arr);
    });
    return map;
  }, [assignments]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Badges"
        subtitle={`${badges.length} badges · ${totalAssigned} attributions actives`}
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground border-0 gap-1.5">
                <Plus className="h-4 w-4" /> Nouveau badge
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Créer un badge</DialogTitle></DialogHeader>
              <BadgeForm
                onSubmit={(v) => { createBadge(v); toast.success("Badge créé"); }}
                onClose={() => setCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs defaultValue="badges" className="space-y-4">
        <TabsList>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="assignments">Attributions</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {badges.map((b, i) => {
            const recipients = recipientsByBadge.get(b.id) ?? [];
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-border bg-card card-shadow p-5 group"
              >
                <div className="flex items-start justify-between">
                  <BadgePill b={b} large />
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(b)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { deleteBadge(b.id); toast.success("Badge supprimé"); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">{b.description || "—"}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{recipients.length} membre{recipients.length > 1 ? "s" : ""}</span>
                  <Button size="sm" variant="outline" onClick={() => { setAssignBadgeId(b.id); setAssignUserId(""); }}>
                    Attribuer
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </TabsContent>

        <TabsContent value="assignments">
          <div className="rounded-xl border border-border bg-card card-shadow divide-y divide-border">
            {assignments.length === 0 && (
              <div className="p-10 text-center text-sm text-muted-foreground">Aucun badge attribué pour l'instant.</div>
            )}
            {assignments.map((a) => {
              const b = badges.find((x) => x.id === a.badgeId);
              if (!b) return null;
              const u = users.find((x) => x.id === a.userId);
              return (
                <div key={a.badgeId + a.userId} className="flex items-center gap-3 p-4">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={u?.avatar} />
                    <AvatarFallback>{a.userName.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{a.userName}</div>
                    <div className="text-xs text-muted-foreground">attribué le {new Date(a.assignedAt).toLocaleString()}</div>
                  </div>
                  <BadgePill b={b} />
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => { revoke(a.badgeId, a.userId); toast.success("Badge révoqué"); }}>
                    <UserMinus className="h-3.5 w-3.5 mr-1" /> Révoquer
                  </Button>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="rounded-xl border border-border bg-card card-shadow">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Historique des changements</span>
            </div>
            <div className="divide-y divide-border max-h-[60vh] overflow-auto scrollbar-thin">
              {history.length === 0 && (
                <div className="p-10 text-center text-sm text-muted-foreground">Aucun événement.</div>
              )}
              {history.map((h) => (
                <div key={h.id} className="flex items-center gap-3 p-3 text-sm">
                  <Badge variant="outline" className="capitalize text-[10px]">{h.type}</Badge>
                  <span className="font-medium">{h.badgeName}</span>
                  {h.userName && <span className="text-muted-foreground">→ {h.userName}</span>}
                  <span className="ml-auto text-xs text-muted-foreground font-mono">{new Date(h.at).toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">par {h.by}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier le badge</DialogTitle></DialogHeader>
          {editing && (
            <BadgeForm
              initial={editing}
              onSubmit={(v) => { updateBadge(editing.id, v); toast.success("Badge mis à jour"); }}
              onClose={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Assign dialog */}
      <Dialog open={!!assignBadgeId} onOpenChange={(o) => !o && setAssignBadgeId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Attribuer un badge</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Utilisateur</Label>
              <Select value={assignUserId} onValueChange={setAssignUserId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un utilisateur…" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name} · {u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignBadgeId(null)}>Annuler</Button>
              <Button
                className="gradient-primary text-primary-foreground border-0"
                onClick={() => {
                  const u = users.find((x) => x.id === assignUserId);
                  if (!u || !assignBadgeId) { toast.error("Sélectionnez un utilisateur"); return; }
                  assign(assignBadgeId, u.id, u.name);
                  toast.success(`Badge attribué à ${u.name}`);
                  setAssignBadgeId(null);
                }}
              >
                Attribuer
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
