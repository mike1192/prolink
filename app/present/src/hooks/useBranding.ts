import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = 'http://localhost:3003/api';

export interface BrandingConfig {
  name: string;
  tagline: string;
  tabTitle: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  sections: {
    hero: { enabled: boolean; order: number };
    problemSolution: { enabled: boolean; order: number };
    features: { enabled: boolean; order: number };
    howItWorks: { enabled: boolean; order: number };
    community: { enabled: boolean; order: number };
    about: { enabled: boolean; order: number };
    contact: { enabled: boolean; order: number };
  };
  customContent: {
    heroTitle: string;
    heroSubtitle: string;
    heroCtaText: string;
    aboutTitle: string;
    aboutDescription: string;
    contactEmail: string;
    contactPhone: string;
  };
}

export const useBranding = () => {
  return useQuery({
    queryKey: ['branding-config'],
    queryFn: async (): Promise<BrandingConfig> => {
      const response = await fetch(`${API_BASE_URL}/branding/config`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement de la configuration');
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Actualiser toutes les 30 secondes
  });
};