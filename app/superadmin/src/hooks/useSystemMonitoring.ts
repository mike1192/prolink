import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

interface SystemMetrics {
    serverStatus: 'online' | 'offline' | 'maintenance';
    responseTime: number;
    activeUsers: number;
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    errorRate: number;
    requestsPerMinute: number;
    databaseConnections: number;
    uptime: number;
}

interface SystemAlert {
    id: string;
    type: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: Date;
    resolved: boolean;
}

export const useSystemMonitoring = () => {
    const { token } = useAuth();
    const [alerts, setAlerts] = useState<SystemAlert[]>([]);

    // Simuler des métriques système en temps réel
    const { data: metrics, isLoading } = useQuery({
        queryKey: ['system-metrics'],
        queryFn: async (): Promise<SystemMetrics> => {
            // Simuler des données système réalistes
            const baseMetrics = {
                serverStatus: 'online' as const,
                responseTime: 120 + Math.random() * 80, // 120-200ms
                activeUsers: 45 + Math.floor(Math.random() * 20), // 45-65 utilisateurs
                memoryUsage: 65 + Math.random() * 20, // 65-85%
                cpuUsage: 30 + Math.random() * 40, // 30-70%
                diskUsage: 45 + Math.random() * 10, // 45-55%
                errorRate: Math.random() * 2, // 0-2%
                requestsPerMinute: 150 + Math.floor(Math.random() * 100), // 150-250 req/min
                databaseConnections: 8 + Math.floor(Math.random() * 4), // 8-12 connexions
                uptime: Date.now() - (7 * 24 * 60 * 60 * 1000) + Math.random() * 1000000, // ~7 jours
            };

            // Simuler des variations plus réalistes
            return baseMetrics;
        },
        refetchInterval: 5000, // Actualiser toutes les 5 secondes
        enabled: !!token,
    });

    // Générer des alertes basées sur les métriques
    useEffect(() => {
        if (!metrics) return;

        const newAlerts: SystemAlert[] = [];

        // Alertes critiques
        if (metrics.cpuUsage > 90) {
            newAlerts.push({
                id: `cpu-${Date.now()}`,
                type: 'critical',
                message: `Utilisation CPU critique: ${metrics.cpuUsage.toFixed(1)}%`,
                timestamp: new Date(),
                resolved: false,
            });
        }

        if (metrics.memoryUsage > 95) {
            newAlerts.push({
                id: `memory-${Date.now()}`,
                type: 'critical',
                message: `Mémoire critique: ${metrics.memoryUsage.toFixed(1)}%`,
                timestamp: new Date(),
                resolved: false,
            });
        }

        if (metrics.errorRate > 5) {
            newAlerts.push({
                id: `error-${Date.now()}`,
                type: 'critical',
                message: `Taux d'erreur élevé: ${metrics.errorRate.toFixed(1)}%`,
                timestamp: new Date(),
                resolved: false,
            });
        }

        // Alertes d'avertissement
        if (metrics.cpuUsage > 80) {
            newAlerts.push({
                id: `cpu-warning-${Date.now()}`,
                type: 'warning',
                message: `Utilisation CPU élevée: ${metrics.cpuUsage.toFixed(1)}%`,
                timestamp: new Date(),
                resolved: false,
            });
        }

        if (metrics.responseTime > 500) {
            newAlerts.push({
                id: `response-${Date.now()}`,
                type: 'warning',
                message: `Temps de réponse lent: ${metrics.responseTime.toFixed(0)}ms`,
                timestamp: new Date(),
                resolved: false,
            });
        }

        if (metrics.diskUsage > 80) {
            newAlerts.push({
                id: `disk-${Date.now()}`,
                type: 'warning',
                message: `Espace disque faible: ${metrics.diskUsage.toFixed(1)}%`,
                timestamp: new Date(),
                resolved: false,
            });
        }

        // Ajouter les nouvelles alertes (éviter les doublons)
        if (newAlerts.length > 0) {
            setAlerts(prev => {
                const existingIds = new Set(prev.map(a => a.id));
                const uniqueNewAlerts = newAlerts.filter(a => !existingIds.has(a.id));
                return [...prev, ...uniqueNewAlerts].slice(-20); // Garder max 20 alertes
            });
        }
    }, [metrics]);

    const resolveAlert = (alertId: string) => {
        setAlerts(prev =>
            prev.map(alert =>
                alert.id === alertId ? { ...alert, resolved: true } : alert
            )
        );
    };

    const clearResolvedAlerts = () => {
        setAlerts(prev => prev.filter(alert => !alert.resolved));
    };

    const getSystemHealth = (): 'excellent' | 'good' | 'warning' | 'critical' => {
        if (!metrics) return 'good';

        const criticalIssues = alerts.filter(a => a.type === 'critical' && !a.resolved).length;
        const warningIssues = alerts.filter(a => a.type === 'warning' && !a.resolved).length;

        if (criticalIssues > 0) return 'critical';
        if (warningIssues > 2) return 'warning';
        if (warningIssues > 0 || metrics.cpuUsage > 70 || metrics.memoryUsage > 80) return 'good';
        return 'excellent';
    };

    const formatUptime = (uptimeMs: number): string => {
        const seconds = Math.floor(uptimeMs / 1000);
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) return `${days}j ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    return {
        metrics,
        alerts: alerts.filter(a => !a.resolved),
        resolvedAlerts: alerts.filter(a => a.resolved),
        isLoading,
        resolveAlert,
        clearResolvedAlerts,
        systemHealth: getSystemHealth(),
        formatUptime,
    };
};