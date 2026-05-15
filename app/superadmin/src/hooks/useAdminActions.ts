import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:3003/api';

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'moderator';
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

interface AdminsResponse {
  admins: Admin[];
  count: number;
}

export interface Message {
  id: string;
  sender_id: string;
  sender_name?: string;
  sender_username?: string;
  receiver_id: string;
  receiver_name?: string;
  receiver_username?: string;
  content: string;
  created_at: string;
  read_at?: string;
}

interface MessagesResponse {
  messages: Message[];
  count: number;
}

interface AnalyticsData {
  userGrowth: Array<{ date: string; new_users: number }>;
  projectGrowth: Array<{ date: string; new_projects: number }>;
  totalNewUsers: number;
  totalNewProjects: number;
}

interface ReportsData {
  period: string;
  data: any;
}

// Hook pour les administrateurs
export const useAdmins = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admins'],
    queryFn: async (): Promise<AdminsResponse> => {
      const response = await fetch(`${API_BASE_URL}/admin/admins`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des administrateurs');
      }

      const data = await response.json();
      return {
        admins: data.admins || [],
        count: data.count || 0,
      };
    },
    enabled: !!token,
    staleTime: 30000,
  });

  const createAdminMutation = useMutation({
    mutationFn: async (newAdmin: {
      name: string;
      email: string;
      role: string;
      password: string;
    }) => {
      const response = await fetch(`${API_BASE_URL}/admin/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newAdmin),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création du compte administrateur');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast.success('Administrateur créé avec succès');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création');
    },
  });

  const updateAdminMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Admin>;
    }) => {
      const response = await fetch(`${API_BASE_URL}/admin/admins/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast.success('Administrateur mis à jour');
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/admin/admins/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la suppression');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast.success('Administrateur supprimé');
    },
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['admins'] });
  };

  return {
    ...query,
    createAdmin: createAdminMutation.mutate,
    updateAdmin: updateAdminMutation.mutate,
    deleteAdmin: deleteAdminMutation.mutate,
    refetch,
    isLoading: query.isLoading || createAdminMutation.isPending,
  };
};

// Hook pour l'analytique
export const useAnalytics = (period: string = '30') => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['analytics', period],
    queryFn: async (): Promise<AnalyticsData> => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/admin/analytics?period=${period}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          return await response.json();
        }

        // Fallback data
        return {
          userGrowth: [],
          projectGrowth: [],
          totalNewUsers: 0,
          totalNewProjects: 0,
        };
      } catch {
        return {
          userGrowth: [],
          projectGrowth: [],
          totalNewUsers: 0,
          totalNewProjects: 0,
        };
      }
    },
    enabled: !!token,
    staleTime: 60000,
  });
};

// Hook pour les rapports
export const useReports = (period: string = '7') => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['reports', period],
    queryFn: async (): Promise<ReportsData> => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/admin/reports?period=${period}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          return await response.json();
        }

        return { period, data: {} };
      } catch {
        return { period, data: {} };
      }
    },
    enabled: !!token,
    staleTime: 60000,
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['reports', period] });
  };

  return {
    ...query,
    refetch,
  };
};

// Hook pour les messages
export const useMessages = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['messages'],
    queryFn: async (): Promise<MessagesResponse> => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/messages`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          return {
            messages: data.messages || [],
            count: data.count || 0,
          };
        }

        return { messages: [], count: 0 };
      } catch {
        return { messages: [], count: 0 };
      }
    },
    enabled: !!token,
    staleTime: 30000,
  });
};

// Hook pour les actions sur les utilisateurs
export const useUserActions = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const suspendUser = useMutation({
    mutationFn: async ({
      userId,
      reason,
    }: {
      userId: string;
      reason: string;
    }) => {
      const response = await fetch(
        `${API_BASE_URL}/admin/users/${userId}/suspend`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la suspension');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Utilisateur suspendu');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    },
  });

  const banUser = useMutation({
    mutationFn: async ({
      userId,
      reason,
    }: {
      userId: string;
      reason: string;
    }) => {
      const response = await fetch(
        `${API_BASE_URL}/admin/users/${userId}/ban`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors du bannissement');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Utilisateur banni');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    },
  });

  const verifyUser = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(
        `${API_BASE_URL}/admin/users/${userId}/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la vérification');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur vérifié');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    },
  });

  return {
    suspendUser,
    banUser,
    verifyUser,
  };
};

// Hook pour les actions sur les projets
export const useProjectActions = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const featureProject = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(
        `${API_BASE_URL}/admin/projects/${projectId}/feature`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la mise en avant');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Projet mis en avant');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(
        `${API_BASE_URL}/admin/projects/${projectId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Projet supprimé');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    },
  });

  return {
    featureProject,
    deleteProject,
  };
};
