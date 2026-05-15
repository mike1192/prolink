import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SectionId =
  | "navbar" | "hero" | "problem-solution" | "features" | "how-it-works"
  | "community" | "about" | "contact" | "cta" | "footer";

export type Section = {
  id: SectionId;
  label: string;
  description: string;
  enabled: boolean;
  locked?: boolean; // navbar/footer suggested as always-on but still toggleable
};

const INITIAL: Section[] = [
  { id: "navbar", label: "Navbar", description: "Barre de navigation principale", enabled: true },
  { id: "hero", label: "Hero", description: "Section héroïque d'accueil", enabled: true },
  { id: "problem-solution", label: "Problème / Solution", description: "Présentation du problème et de la solution", enabled: true },
  { id: "features", label: "Fonctionnalités", description: "Fonctionnalités principales", enabled: true },
  { id: "how-it-works", label: "Comment ça marche", description: "Étapes d'utilisation", enabled: true },
  { id: "community", label: "Communauté", description: "Section communauté", enabled: true },
  { id: "about", label: "À propos", description: "Présentation de l'équipe / mission", enabled: true },
  { id: "contact", label: "Contact", description: "Formulaire de contact", enabled: true },
  { id: "cta", label: "Call To Action", description: "Appel à l'action final", enabled: true },
  { id: "footer", label: "Footer", description: "Pied de page", enabled: true },
];

type SectionsState = {
  sections: Section[];
  toggle: (id: SectionId) => void;
  move: (id: SectionId, direction: -1 | 1) => void;
  reset: () => void;
};

export const useSections = create<SectionsState>()(
  persist(
    (set) => ({
      sections: INITIAL,
      toggle: (id) =>
        set((s) => ({ sections: s.sections.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)) })),
      move: (id, direction) =>
        set((s) => {
          const arr = [...s.sections];
          const i = arr.findIndex((x) => x.id === id);
          const j = i + direction;
          if (i < 0 || j < 0 || j >= arr.length) return { sections: arr };
          [arr[i], arr[j]] = [arr[j], arr[i]];
          return { sections: arr };
        }),
      reset: () => set({ sections: INITIAL }),
    }),
    { name: "projectlink-sections" },
  ),
);
