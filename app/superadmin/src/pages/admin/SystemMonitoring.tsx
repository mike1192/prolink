import { useState, useEffect } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  Wifi, 
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Clock,
  Zap,
  Globe,
  Shield,
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts";

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature: number;
  };
  memory: {
    used: number;
    total: number;
    usage: number;
  };
  disk: {
    used: number;
    total: number;
    usage: number;
  };
  network: {
    inbound: number;
    outbound: number;
    latency: number;
  };
  database: {
    connections: number;
    maxConnections: number;
    queryTime: number;
    cacheHitRate: number;
  };
  api: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
    activeConnections: number;
  };
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'down';
  uptime: string;
  lastCheck: string;
  responseTime: number;
  url?: string;
}

// Données simulées pour les métriques système
const generateMockMetrics = (): SystemMetrics => ({
  cpu: {
    usage: Math.random() * 100,
    cores: 8,
    temperature: 45 + Math.random() * 20
  },
  memory: {
    used: 6.2 + Math.random() * 2,
    total: 16,
    usage: (6.2 + Math.random() * 2) / 16 * 100
  },
  disk: {
    used: 120 + Math.random() * 50,
    total: 500,
    usage: (120 + Math.random() * 50) / 500 * 100
  },
  network: {
    inbound: Math.random() * 100,
    outbound: Math.random() * 80,
    latency: 10 + Math.random() * 20
  },
  database: {
    connections: Math.floor(Math.random() * 50) + 10,
    maxConnections: 100,
    queryTime: Math.random() * 50 + 5,
    cacheHitRate: 85 + Math.random() * 10
  },
  api: {
    requestsPerMinute: Math.floor(Math.random() * 1000) + 500,
    averageResponseTime: Math.random() * 200 + 50,
    errorRate: Math.random() * 5,
    activeConnections: Math.floor(Math.random() * 200) + 100
  }
});

const mockServices: ServiceStatus[] = [
  {
    name: 'API Principal',
    status: 'healthy',
    uptime: '99.9%',
    lastCheck: '2024-01-15T14:30:00Z',
    responseTime: 45,
    url: 'https://api.projectlink.com'
  },
  {
    name: 'Base de Données',
    status: 'healthy',
    uptime: '99.8%',
    lastCheck: '2024-01-15T14:30:00Z',
    responseTime: 12
  },
  {
    name: 'Service Email',
    status: 'warning',
    uptime: '98.5%',
    lastCheck: '2024-01-15T14:29:00Z',
    responseTime: 156,
    url: 'smtp.projectlink.com'
  },
  {
    name: 'CDN',
    status: 'healthy',
    uptime: '99.9%',
    lastCheck: '2024-01-15T14:30:00Z',
    responseTime: 23,
    url: 'cdn.projectlink.com'
  },
  {
    name: 'WebSocket',
    status: 'healthy',
    uptime: '99.7%',
    lastCheck: '2024-01-15T14:30:00Z',
    responseTime: 8
  },
  {
    name: 'Service de Fichiers',
    status: 'critical',
    uptime: '95.2%',
    lastCheck: '2024-01-15T14:28:00Z',
    responseTime: 2340,
    url: 'files.projectlink.com'
  }
];

// Données historiques simulées
const generateHistoricalData = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      requests: Math.floor(Math.random() * 1000) + 200,
      responseTime: Math.random() * 200 + 50,
      errors: Math.random() * 10
    });
  }
  
  return data;
};

export default function SystemMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetrics>(generateMockMetrics());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [historicalData] = useState(generateHistoricalData());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Simulation de mise à jour en temps réel
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setMetrics(generateMockMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setMetrics(generateMockMetrics());
    setIsRefreshing(false);
    toast.success("Métriques actualisées");
  };

  const getStatusBadge = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800 border-green-200">En ligne</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Attention</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Critique</Badge>;
      case 'down':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Hors ligne</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
      case 'down':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (uptime: string) => {
    return uptime;
  };

  const pieData = [
    { name: 'CPU', value: metrics.cpu.usage, color: '#3b82f6' },
    { name: 'Mémoire', value: metrics.memory.usage, color: '#10b981' },
    { name: 'Disque', value: metrics.disk.usage, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Surveillance Système"
        subtitle="Monitoring en temps réel de l'infrastructure"
        actions={
          <div className="flex gap-2">
            <Button 
              variant={autoRefresh ? "default" : "outline"} 
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Activity className="h-4 w-4 mr-2" />
              {autoRefresh ? "Auto ON" : "Auto OFF"}
            </Button>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm" 
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        }
      />

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU</CardTitle>
              <Cpu className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.cpu.usage.toFixed(1)}%</div>
              <Progress value={metrics.cpu.usage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.cpu.cores} cœurs • {metrics.cpu.temperature.toFixed(1)}°C
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mémoire</CardTitle>
              <HardDrive className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.memory.usage.toFixed(1)}%</div>
              <Progress value={metrics.memory.usage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.memory.used.toFixed(1)} GB / {metrics.memory.total} GB
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disque</CardTitle>
              <Database className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.disk.usage.toFixed(1)}%</div>
              <Progress value={metrics.disk.usage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.disk.used.toFixed(0)} GB / {metrics.disk.total} GB
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Réseau</CardTitle>
              <Wifi className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.network.latency.toFixed(0)}ms</div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>↓ {metrics.network.inbound.toFixed(1)} MB/s</span>
                <span>↑ {metrics.network.outbound.toFixed(1)} MB/s</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="database">Base de données</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Graphique des ressources */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Utilisation des Ressources (24h)
                </CardTitle>
                <CardDescription>
                  Évolution de l'utilisation CPU, mémoire et disque
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                      }}
                    />
                    <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} name="CPU %" />
                    <Line type="monotone" dataKey="memory" stroke="#10b981" strokeWidth={2} name="Mémoire %" />
                    <Line type="monotone" dataKey="disk" stroke="#f59e0b" strokeWidth={2} name="Disque %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Répartition des ressources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Répartition Actuelle
                </CardTitle>
                <CardDescription>
                  Utilisation instantanée des ressources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Métriques API */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Requêtes/min</CardTitle>
                <Globe className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.api.requestsPerMinute}</div>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +12% vs hier
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Temps de réponse</CardTitle>
                <Clock className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.api.averageResponseTime.toFixed(0)}ms</div>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <TrendingDown className="h-3 w-3" />
                  -5% vs hier
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux d'erreur</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.api.errorRate.toFixed(2)}%</div>
                <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +0.1% vs hier
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connexions actives</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.api.activeConnections}</div>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +8% vs hier
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockServices.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(service.status)}
                        {service.name}
                      </CardTitle>
                      {getStatusBadge(service.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Uptime</span>
                        <span className="font-medium">{service.uptime}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Temps de réponse</span>
                        <span className="font-medium">{service.responseTime}ms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Dernière vérification</span>
                        <span className="font-medium">
                          {new Date(service.lastCheck).toLocaleTimeString('fr-FR')}
                        </span>
                      </div>
                      {service.url && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">URL</span>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {service.url}
                          </code>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance API (24h)
              </CardTitle>
              <CardDescription>
                Évolution des requêtes et temps de réponse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="requests" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                    name="Requêtes"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.3}
                    name="Temps de réponse (ms)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connexions</CardTitle>
                <Database className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.database.connections}</div>
                <Progress 
                  value={(metrics.database.connections / metrics.database.maxConnections) * 100} 
                  className="mt-2" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Max: {metrics.database.maxConnections}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Temps de requête</CardTitle>
                <Clock className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.database.queryTime.toFixed(1)}ms</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Moyenne sur 5min
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                <Zap className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.database.cacheHitRate.toFixed(1)}%</div>
                <Progress value={metrics.database.cacheHitRate} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Excellent
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Statut</CardTitle>
                <Shield className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Opérationnel</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Uptime: 99.9%
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}