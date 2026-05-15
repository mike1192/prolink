import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from './useAuth';

const API_BASE_URL = 'http://localhost:3003/api';

// Types pour les données
export interface User {
    id: string;
    username: string;
    display_name: string;
    email: string;
    bio?: string;
    avatar_url?: string;
    skills?: string[];
    created_at: string;
    verified_skills?: string[];
    job_title?: string;
    location?: string;
}

export interface Project {
    id: string;
    title: string;
    description: string;
    owner_id: string;
    owner_name: string;
    owner_avatar?: string;
    skills_needed?: string[];
    project_type: string;
    created_at: string;
    likes_count: number;
    comments_count: number;
}

export interface DashboardStats {
    totalUsers: number;
    totalProjects: number;
    activeProjects: number;
    totalInteractions: number;
    userGrowth: number;
    projectGrowth: number;
    interactionGrowth: number;
}

// Hook pour les statistiques du dashboard
export const useDashboardStats = () => {
    const { token } = useAuth();

    return useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async (): Promise<DashboardStats> => {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            try {
                // Utiliser la route dédiée aux statistiques admin
                const response = await fetch(`${API_BASE_URL}/admin/stats`, { headers });

                if (response.ok) {
                    return await response.json();
                }

                // Fallback: calculer manuellement si la route n'est pas disponible
                const usersResponse = await fetch(`${API_BASE_URL}/admin/users`, { headers });
                const projectsResponse = await fetch(`${API_BASE_URL}/admin/projects`, { headers });

                const usersData = usersResponse.ok ? await usersResponse.json() : { users: [] };
                const projectsData = projectsResponse.ok ? await projectsResponse.json() : { projects: [] };

                const users = usersData.users || [];
                const projects = projectsData.projects || [];

                // Calculer les statistiques
                const totalUsers = users.length;
                const totalProjects = projects.length;

                // Projets actifs (créés dans les 30 derniers jours)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const activeProjects = projects.filter((p: Project) => new Date(p.created_at) > thirtyDaysAgo).length;

                // Calculer les interactions (likes + commentaires)
                const totalInteractions = projects.reduce((sum: number, p: Project) => sum + (p.likes_count || 0) + (p.comments_count || 0), 0);

                return {
                    totalUsers,
                    totalProjects,
                    activeProjects,
                    totalInteractions,
                    userGrowth: 12.4, // Placeholder - à calculer avec les vraies données
                    projectGrowth: 8.1,
                    interactionGrowth: 23.7,
                };
            } catch (error) {
                console.error('Erreur lors de la récupération des statistiques:', error);
                return {
                    totalUsers: 0,
                    totalProjects: 0,
                    activeProjects: 0,
                    totalInteractions: 0,
                    userGrowth: 0,
                    projectGrowth: 0,
                    interactionGrowth: 0,
                };
            }
        },
        refetchInterval: 30000, // Actualiser toutes les 30 secondes
        staleTime: 10000, // Considérer les données comme fraîches pendant 10 secondes
    });
};

// Hook pour les utilisateurs
export const useUsers = () => {
    const { token } = useAuth();

    return useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/admin/users`, { headers });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des utilisateurs');
            }

            const data = await response.json();
            return data; // Retourne l'objet complet avec users et pagination
        },
        refetchInterval: 15000, // Actualiser toutes les 15 secondes
    });
};

// Hook pour les projets
export const useProjects = () => {
    const { token } = useAuth();

    return useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/admin/projects`, { headers });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des projets');
            }

            const data = await response.json();
            return data.projects || []; // Retourne uniquement le tableau des projets
        },
        refetchInterval: 15000,
    });
};

// Hook pour les activités récentes
export const useRecentActivity = () => {
    const { token } = useAuth();

    return useQuery({
        queryKey: ['recent-activity'],
        queryFn: async () => {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            try {
                // Utiliser la route dédiée aux activités admin
                const response = await fetch(`${API_BASE_URL}/admin/activity?limit=10`, { headers });

                if (response.ok) {
                    return await response.json();
                }

                // Fallback: récupérer les projets récents et les transformer en activités
                const projectsResponse = await fetch(`${API_BASE_URL}/admin/projects?limit=10`, { headers });
                const projectsData = projectsResponse.ok ? await projectsResponse.json() : { projects: [] };
                const projects = projectsData.projects || [];

                // Transformer en format d'activité
                return projects.map((project: Project) => ({
                    id: project.id,
                    who: project.owner_name || 'Utilisateur',
                    what: 'a publié le projet',
                    target: project.title,
                    time: getTimeAgo(project.created_at),
                }));
            } catch (error) {
                console.error('Erreur lors de la récupération de l\'activité:', error);
                return [];
            }
        },
        refetchInterval: 10000, // Actualiser toutes les 10 secondes
    });
};

// Fonction utilitaire pour calculer le temps écoulé
function getTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'quelques secondes';
    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)} jour(s)`;
}

// Hook pour WebSocket en temps réel avec vérification préalable du serveur
export const useWebSocketUpdates = () => {
    const queryClient = useQueryClient();
    const { token } = useAuth();

    useEffect(() => {
        if (!token) return;

        let ws: WebSocket | null = null;
        let reconnectTimer: NodeJS.Timeout | null = null;
        let healthCheckTimer: NodeJS.Timeout | null = null;
        let isActive = true;

        // Fonction pour vérifier si le serveur est disponible
        const checkServerHealth = async (): Promise<boolean> => {
            try {
                const response = await fetch('http://localhost:3003/api/health', {
                    method: 'GET',
                    timeout: 2000
                } as RequestInit);
                return response.ok;
            } catch {
                return false;
            }
        };

        const connectWebSocket = async () => {
            if (!isActive) return;

            // Vérifier d'abord si le serveur est disponible
            const serverAvailable = await checkServerHealth();
            if (!serverAvailable) {
                console.log('🔍 Serveur non disponible, nouvelle vérification dans 10s');
                healthCheckTimer = setTimeout(() => {
                    if (isActive) connectWebSocket();
                }, 10000);
                return;
            }

            try {
                ws = new WebSocket(`ws://localhost:3003`);

                const connectionTimeout = setTimeout(() => {
                    if (ws && ws.readyState === WebSocket.CONNECTING) {
                        ws.close();
                    }
                }, 3000);

                ws.onopen = () => {
                    clearTimeout(connectionTimeout);
                    console.log('🔌 WebSocket admin connecté');
                    
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'admin_join',
                            token: token
                        }));
                    }
                };

                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        if (message.type === 'admin_update') {
                            const { type: eventType } = message.data;
                            
                            // Invalider les queries selon le type
                            switch (eventType) {
                                case 'user_created':
                                case 'user_updated':
                                case 'user_deleted':
                                    queryClient.invalidateQueries({ queryKey: ['users'] });
                                    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                                    break;
                                case 'project_created':
                                case 'project_updated':
                                case 'project_deleted':
                                case 'project_liked':
                                    queryClient.invalidateQueries({ queryKey: ['projects'] });
                                    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                                    queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
                                    break;
                                case 'stats_updated':
                                    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                                    break;
                            }
                        }
                    } catch (error) {
                        // Ignorer les erreurs de parsing silencieusement
                    }
                };

                ws.onclose = (event) => {
                    clearTimeout(connectionTimeout);
                    if (event.code !== 1000 && isActive) {
                        // Reconnecter après 15 secondes seulement
                        reconnectTimer = setTimeout(() => {
                            if (isActive) connectWebSocket();
                        }, 15000);
                    }
                };

                ws.onerror = () => {
                    clearTimeout(connectionTimeout);
                    // Erreur silencieuse - pas de log pour éviter le spam
                };

            } catch (error) {
                // Erreur silencieuse lors de la création
            }
        };

        // Démarrer la connexion après 5 secondes
        const initialDelay = setTimeout(() => {
            if (isActive) connectWebSocket();
        }, 5000);

        return () => {
            isActive = false;
            clearTimeout(initialDelay);
            if (reconnectTimer) clearTimeout(reconnectTimer);
            if (healthCheckTimer) clearTimeout(healthCheckTimer);
            if (ws) ws.close(1000, 'Component unmounted');
        };
    }, [token, queryClient]);
};