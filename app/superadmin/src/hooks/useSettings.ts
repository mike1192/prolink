import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:3003/api';

export interface PlatformSettings {
  platform: {
    name: string;
    description: string;
    url: string;
    logo: string;
    favicon: string;
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
  security: {
    twoFactorRequired: boolean;
    emailVerification: boolean;
    blockDisposableEmails: boolean;
    adminActivityLogs: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireStrongPasswords: boolean;
  };
  api: {
    key: string;
    rateLimit: number;
    enableCors: boolean;
    allowedOrigins: string[];
    webhookSecret: string;
  };
  limits: {
    maxProjectsPerUser: number;
    maxCommentsPerMinute: number;
    maxUploadSizeMB: number;
    maxTeamMembers: number;
    maxSkillsPerUser: number;
  };
  email: {
    provider: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
  notifications: {
    enableEmailNotifications: boolean;
    enablePushNotifications: boolean;
    enableSlackIntegration: boolean;
    slackWebhook: string;
    notifyOnNewUser: boolean;
    notifyOnNewProject: boolean;
    notifyOnError: boolean;
  };
}

// Hook pour récupérer les paramètres
export const useSettings = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['admin-settings'],
    queryFn: async (): Promise<PlatformSettings> => {
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des paramètres');
      }
      
      return response.json();
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour mettre à jour les paramètres
export const useUpdateSettings = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<PlatformSettings>): Promise<{ success: boolean; settings: PlatformSettings }> => {
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la sauvegarde');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Mettre à jour le cache
      queryClient.setQueryData(['admin-settings'], data.settings);
      
      // Invalider les queries liées
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      
      toast.success('Paramètres sauvegardés avec succès');
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  });
};

// Hook pour générer une nouvelle clé API
export const useGenerateApiKey = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ apiKey: string }> => {
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`${API_BASE_URL}/admin/settings/generate-api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la génération');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Mettre à jour la clé API dans le cache
      queryClient.setQueryData(['admin-settings'], (oldData: PlatformSettings | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          api: {
            ...oldData.api,
            key: data.apiKey
          }
        };
      });
      
      toast.success('Nouvelle clé API générée');
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la génération:', error);
      toast.error(error.message || 'Erreur lors de la génération');
    }
  });
};

// Hook pour tester la configuration email
export const useTestEmailConfig = () => {
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (emailConfig: PlatformSettings['email']): Promise<{ success: boolean }> => {
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`${API_BASE_URL}/admin/settings/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(emailConfig)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors du test');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Email de test envoyé avec succès');
    },
    onError: (error: Error) => {
      console.error('Erreur lors du test email:', error);
      toast.error(error.message || 'Erreur lors du test email');
    }
  });
};

// Hook pour réinitialiser les paramètres
export const useResetSettings = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ success: boolean; settings: PlatformSettings }> => {
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`${API_BASE_URL}/admin/settings/reset`, {
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
      queryClient.setQueryData(['admin-settings'], data.settings);
      
      // Invalider les queries liées
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      
      toast.success('Paramètres réinitialisés avec succès');
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la réinitialisation:', error);
      toast.error(error.message || 'Erreur lors de la réinitialisation');
    }
  });
};