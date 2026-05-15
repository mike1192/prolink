import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Server, 
  Database, 
  Wifi, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical';
  services: {
    api: { status: 'up' | 'down' | 'degraded'; responseTime: number; uptime: number };
    database: { status: 'up' | 'down' | 'degraded'; connections: number; queryTime: number };
    storage: { status: 'up' | 'down' | 'degraded'; usage: number; available: number };
    network: { status: 'up' | 'down' | 'degraded'; latency: number; throughput: number };
  };
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    activeUsers: number;
    requestsPerMinute: number;
    errorRate: number;
  };
  lastUpdate: string;
}

// Simulation de données système en temps réel
const generateSystemStatus = (): SystemStatus => {
  const cpu = Math.random() * 100;
  const memory = Math.random() * 100;
  const disk = Math.random() * 100;
  const errorRate = Math.random() * 5;
  
  // Déterminer le statut global
  let overall: SystemStatus['overall'] = 'healthy';
  if (cpu > 80 || memory > 85 || disk > 90 || errorRate > 3) {
    overall = 'critical';
  } else if (cpu > 60 || memory > 70 || disk > 75 || errorRate > 1) {
    overall = 'warning';
  }

  return {
    overall,
    services: {
      api: {
        status: Math.random() > 0.1 ? 'up' : 'degraded',
        responseTime: Math.random() * 200 + 50,
        uptime: 99.9
      },
      database: {
        status: Math.random() > 0.05 ? 'up' : 'degraded',
        connections: Math.floor(Math.random() * 50) + 10,
        queryTime: Math.random() * 50 + 5
      },
      storage: {
        status: 'up',
        usage: disk,
        available: 500 - (disk * 5)
      },
      network: {
        status: Math.random() > 0.02 ? 'up' : 'degraded',
        latency: Math.random() * 30 + 10,
        throughput: Math.random() * 100 + 50
      }
    },
    metrics: {
      cpu,
      memory,
      disk,
      activeUsers: Math.floor(Math.random() * 500) + 100,
      requestsPerMinute: Math.floor(Math.random() * 1000) + 200,
      errorRate
    },
    lastUpdate: new Date().toISOString()
  };
};

export function SystemStatusWidget() {
  const [status, setStatus] = useState<SystemStatus>(generateSystemStatus());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  // Mise à jour automatique toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(generateSystemStatus());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simuler un délai de chargement
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStatus(generateSystemStatus());
    setIsRefreshing(false);
  };

  const getStatusIcon = (serviceStatus: 'up' | 'down' | 'degraded') => {
    switch (serviceStatus) {
      case 'up':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (serviceStatus: 'up' | 'down' | 'degraded') => {
    switch (serviceStatus) {
      case 'up':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Opérationnel</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Dégradé</Badge>;
      case 'down':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Hors ligne</Badge>;
    }
  };

  const getOverallStatusColor = () => {
    switch (status.overall) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
    }
  };

  const getOverallStatusBg = () => {
    switch (status.overall) {
      case 'healthy':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'bg-red-50 border-red-200';
    }
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`;
  };

  const formatBytes = (bytes: number) => {
    return `${bytes.toFixed(1)} GB`;
  };

  return (
    <Card className={`${getOverallStatusBg()}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className={`h-5 w-5 ${getOverallStatusColor()}`} />
              Statut Système
            </CardTitle>
            <CardDescription>
              Surveillance en temps réel de l'infrastructure
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/system-monitoring')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Statut global */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              status.overall === 'healthy' ? 'bg-green-500' :
              status.overall === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            } animate-pulse`} />
            <span className="font-medium">
              {status.overall === 'healthy' ? 'Tous les systèmes opérationnels' :
               status.overall === 'warning' ? 'Problèmes mineurs détectés' :
               'Problèmes critiques détectés'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Mis à jour {new Date(status.lastUpdate).toLocaleTimeString('fr-FR')}
          </span>
        </div>

        {/* Services */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Services</h4>
          <div className="grid grid-cols-2 gap-3">
            <motion.div 
              className="flex items-center justify-between p-2 rounded-lg bg-background/50"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">API</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.services.api.status)}
                <span className="text-xs text-muted-foreground">
                  {status.services.api.responseTime.toFixed(0)}ms
                </span>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center justify-between p-2 rounded-lg bg-background/50"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Base de données</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.services.database.status)}
                <span className="text-xs text-muted-foreground">
                  {status.services.database.connections} conn.
                </span>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center justify-between p-2 rounded-lg bg-background/50"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Stockage</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.services.storage.status)}
                <span className="text-xs text-muted-foreground">
                  {status.services.storage.usage.toFixed(0)}%
                </span>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center justify-between p-2 rounded-lg bg-background/50"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Réseau</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.services.network.status)}
                <span className="text-xs text-muted-foreground">
                  {status.services.network.latency.toFixed(0)}ms
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Métriques clés */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Métriques</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>CPU</span>
              <span className="font-medium">{status.metrics.cpu.toFixed(1)}%</span>
            </div>
            <Progress value={status.metrics.cpu} className="h-2" />
            
            <div className="flex items-center justify-between text-sm">
              <span>Mémoire</span>
              <span className="font-medium">{status.metrics.memory.toFixed(1)}%</span>
            </div>
            <Progress value={status.metrics.memory} className="h-2" />
            
            <div className="flex items-center justify-between text-sm">
              <span>Disque</span>
              <span className="font-medium">{status.metrics.disk.toFixed(1)}%</span>
            </div>
            <Progress value={status.metrics.disk} className="h-2" />
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-bold">{status.metrics.activeUsers}</div>
            <div className="text-xs text-muted-foreground">Utilisateurs actifs</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{status.metrics.requestsPerMinute}</div>
            <div className="text-xs text-muted-foreground">Req/min</div>
          </div>
        </div>

        {/* Taux d'erreur */}
        {status.metrics.errorRate > 1 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">
              Taux d'erreur élevé: {status.metrics.errorRate.toFixed(2)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}