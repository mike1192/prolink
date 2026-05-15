import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Badge = {
  id: string;
  name: string;
  description: string;
  color: string; // tailwind token or hex
  icon: string; // lucide icon name (free string)
  createdAt: string;
};

export type BadgeAssignment = {
  badgeId: string;
  userId: string;
  userName: string;
  assignedAt: string;
};

export type BadgeHistoryEntry = {
  id: string;
  type: "create" | "update" | "delete" | "assign" | "revoke";
  badgeId: string;
  badgeName: string;
  userName?: string;
  by: string;
  at: string;
  note?: string;
};

type State = {
  badges: Badge[];
  assignments: BadgeAssignment[];
  history: BadgeHistoryEntry[];
  createBadge: (b: Omit<Badge, "id" | "createdAt">) => void;
  updateBadge: (id: string, patch: Partial<Badge>) => void;
  deleteBadge: (id: string) => void;
  assign: (badgeId: string, userId: string, userName: string) => void;
  revoke: (badgeId: string, userId: string) => void;
};

const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

const DEFAULT_BADGES: Badge[] = [
  { id: "b_pioneer", name: "Pioneer", description: "A des 100 premiers utilisateurs", color: "#a855f7", icon: "Rocket", createdAt: now() },
  { id: "b_top", name: "Top Creator", description: "10+ projets featured", color: "#ec4899", icon: "Crown", createdAt: now() },
  { id: "b_early", name: "Early Bird", description: "Inscrit pendant la beta", color: "#3b82f6", icon: "Sun", createdAt: now() },
  { id: "b_verified", name: "Verified", description: "Identité vérifiée", color: "#22c55e", icon: "BadgeCheck", createdAt: now() },
];

export const useBadges = create<State>()(
  persist(
    (set) => ({
      badges: DEFAULT_BADGES,
      assignments: [],
      history: [],
      createBadge: (b) =>
        set((s) => {
          const badge: Badge = { ...b, id: `b_${uid()}`, createdAt: now() };
          return {
            badges: [badge, ...s.badges],
            history: [
              { id: uid(), type: "create", badgeId: badge.id, badgeName: badge.name, by: "Admin", at: now() },
              ...s.history,
            ],
          };
        }),
      updateBadge: (id, patch) =>
        set((s) => {
          const badge = s.badges.find((x) => x.id === id);
          if (!badge) return s;
          return {
            badges: s.badges.map((b) => (b.id === id ? { ...b, ...patch } : b)),
            history: [
              { id: uid(), type: "update", badgeId: id, badgeName: badge.name, by: "Admin", at: now() },
              ...s.history,
            ],
          };
        }),
      deleteBadge: (id) =>
        set((s) => {
          const badge = s.badges.find((x) => x.id === id);
          return {
            badges: s.badges.filter((b) => b.id !== id),
            assignments: s.assignments.filter((a) => a.badgeId !== id),
            history: badge
              ? [{ id: uid(), type: "delete", badgeId: id, badgeName: badge.name, by: "Admin", at: now() }, ...s.history]
              : s.history,
          };
        }),
      assign: (badgeId, userId, userName) =>
        set((s) => {
          if (s.assignments.some((a) => a.badgeId === badgeId && a.userId === userId)) return s;
          const badge = s.badges.find((b) => b.id === badgeId);
          if (!badge) return s;
          return {
            assignments: [{ badgeId, userId, userName, assignedAt: now() }, ...s.assignments],
            history: [
              { id: uid(), type: "assign", badgeId, badgeName: badge.name, userName, by: "Admin", at: now() },
              ...s.history,
            ],
          };
        }),
      revoke: (badgeId, userId) =>
        set((s) => {
          const a = s.assignments.find((x) => x.badgeId === badgeId && x.userId === userId);
          const badge = s.badges.find((b) => b.id === badgeId);
          return {
            assignments: s.assignments.filter((x) => !(x.badgeId === badgeId && x.userId === userId)),
            history:
              a && badge
                ? [
                    { id: uid(), type: "revoke", badgeId, badgeName: badge.name, userName: a.userName, by: "Admin", at: now() },
                    ...s.history,
                  ]
                : s.history,
          };
        }),
    }),
    { name: "projectlink-badges" },
  ),
);
