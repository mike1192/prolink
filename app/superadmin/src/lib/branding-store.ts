import { create } from "zustand";
import { persist } from "zustand/middleware";

type BrandingState = {
  name: string;
  tagline: string;
  tabTitle: string;
  logoUrl: string | null;
  setName: (v: string) => void;
  setTagline: (v: string) => void;
  setTabTitle: (v: string) => void;
  setLogoUrl: (v: string | null) => void;
  reset: () => void;
};

const DEFAULTS = {
  name: "Projectlink",
  tagline: "The home for makers shipping the future.",
  tabTitle: "Projectlink Admin — Control Center",
  logoUrl: null as string | null,
};

export const useBranding = create<BrandingState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setName: (name) => set({ name }),
      setTagline: (tagline) => set({ tagline }),
      setTabTitle: (tabTitle) => set({ tabTitle }),
      setLogoUrl: (logoUrl) => set({ logoUrl }),
      reset: () => set(DEFAULTS),
    }),
    { name: "projectlink-branding" },
  ),
);

/** Sync document.title and favicon when branding changes */
export function applyBrandingToDocument(state: { tabTitle: string; logoUrl: string | null; name: string }) {
  if (typeof document === "undefined") return;
  document.title = state.tabTitle || `${state.name} Admin`;
  if (state.logoUrl) {
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = state.logoUrl;
  }
}
