import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

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

// Hook pour récupérer la configuration de branding
export const useBrandingConfig = () => {
  const query = useQuery({
    queryKey: ['branding-config'],
    queryFn: async (): Promise<BrandingConfig> => {
      const response = await fetch(`${API_BASE_URL}/branding/config`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement de la configuration');
      }
      
      return response.json();
    },
    staleTime: 30 * 1000, // 30 secondes
    refetchInterval: 60 * 1000, // Actualiser toutes les minutes
  });
  
  const updateMutation = useUpdateBrandingConfig();
  const resetMutation = useResetBrandingConfig();
  
  return {
    ...query,
    updateConfig: updateMutation.mutate,
    resetConfig: resetMutation.mutate,
    isUpdating: updateMutation.isPending,
    isResetting: resetMutation.isPending
  };
};

// Hook pour mettre à jour la configuration de branding
export const useUpdateBrandingConfig = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: BrandingConfig): Promise<{ success: boolean; config: BrandingConfig }> => {
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`${API_BASE_URL}/branding/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la sauvegarde');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Mettre à jour le cache
      queryClient.setQueryData(['branding-config'], data.config);
      
      // Invalider les queries liées
      queryClient.invalidateQueries({ queryKey: ['branding-config'] });
      
      toast.success('Configuration sauvegardée avec succès');
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  });
};

// Hook pour réinitialiser la configuration
export const useResetBrandingConfig = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ success: boolean; config: BrandingConfig }> => {
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`${API_BASE_URL}/branding/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la réinitialisation');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Mettre à jour le cache
      queryClient.setQueryData(['branding-config'], data.config);
      
      // Invalider les queries liées
      queryClient.invalidateQueries({ queryKey: ['branding-config'] });
      
      toast.success('Configuration réinitialisée avec succès');
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la réinitialisation:', error);
      toast.error(error.message || 'Erreur lors de la réinitialisation');
    }
  });
};

// Hook pour uploader un logo
export const useUploadLogo = () => {
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (file: File): Promise<{ url: string }> => {
      if (!token) {
        throw new Error('Non authentifié');
      }

      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(`${API_BASE_URL}/branding/upload-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'upload');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Logo uploadé avec succès');
    },
    onError: (error: Error) => {
      console.error('Erreur lors de l\'upload:', error);
      toast.error(error.message || 'Erreur lors de l\'upload');
    }
  });
};

// Hook pour prévisualiser les changements
export const useBrandingPreview = () => {
  return {
    openPreview: (config: BrandingConfig) => {
      // Ouvrir une nouvelle fenêtre avec les paramètres de branding appliqués
      const previewWindow = window.open('http://localhost:8080', '_blank');
      
      if (previewWindow) {
        // Attendre que la page se charge puis appliquer les styles
        previewWindow.addEventListener('load', () => {
          try {
            const doc = previewWindow.document;
            
            // Appliquer les couleurs
            doc.documentElement.style.setProperty('--primary', config.primaryColor);
            doc.documentElement.style.setProperty('--accent', config.accentColor);
            
            // Mettre à jour le titre
            doc.title = config.tabTitle;
            
            // Mettre à jour le favicon si un logo est défini
            if (config.logoUrl) {
              let favicon = doc.querySelector('link[rel="icon"]') as HTMLLinkElement;
              if (!favicon) {
                favicon = doc.createElement('link');
                favicon.rel = 'icon';
                doc.head.appendChild(favicon);
              }
              favicon.href = config.logoUrl;
            }
          } catch (error) {
            console.warn('Impossible d\'appliquer les styles de prévisualisation:', error);
          }
        });
      }
    }
  };
};

// Hook pour valider la configuration
export const useBrandingValidation = () => {
  const validateConfig = (config: BrandingConfig): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validation des champs requis
    if (!config.name.trim()) {
      errors.push('Le nom de la plateforme est requis');
    }

    if (!config.tagline.trim()) {
      errors.push('Le slogan est requis');
    }

    if (!config.tabTitle.trim()) {
      errors.push('Le titre de l\'onglet est requis');
    }

    // Validation des couleurs
    const colorRegex = /^#[0-9A-F]{6}$/i;
    if (!colorRegex.test(config.primaryColor)) {
      errors.push('La couleur principale doit être un code hexadécimal valide');
    }

    if (!colorRegex.test(config.accentColor)) {
      errors.push('La couleur d\'accent doit être un code hexadécimal valide');
    }

    // Validation de l'email de contact
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (config.customContent.contactEmail && !emailRegex.test(config.customContent.contactEmail)) {
      errors.push('L\'email de contact n\'est pas valide');
    }

    // Validation de l'URL du logo
    if (config.logoUrl) {
      try {
        new URL(config.logoUrl);
      } catch {
        errors.push('L\'URL du logo n\'est pas valide');
      }
    }

    // Validation des sections (au moins une doit être activée)
    const enabledSections = Object.values(config.sections).filter(section => section.enabled);
    if (enabledSections.length === 0) {
      errors.push('Au moins une section doit être activée');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return { validateConfig };
};