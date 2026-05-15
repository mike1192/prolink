import { useState, useMemo } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Search, 
  Filter, 
  RefreshCw,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Settings,
  Trash2,
  Ban,
  UserCheck,
  FileText,
  Database,
  Key,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface AuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  admin_email: string;
  action: string;
  target_type: 'user' | 'project' | 'admin' | 'system' | 'settings';
  target_id?: string;
  target_name?: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Données simulées pour les logs d'audit
const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    admin_id: 'admin1',
    admin_name: 'Jean Dupont',
    admin_email: 'jean.dupont@projectlink.com',
    action: 'user_suspended',
    target_type: 'user',
    target_id: 'user123',
    target_name: 'Marie Martin',
    details: { reason: 'Violation des conditions d\'utilisation', duration: '7 days' },
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    created_at: '2024-01-15T14:30:00Z',
    severity: 'high'
  },
  {
    id: '2',
    admin_id: 'admin2',
    admin_name: 'Sophie Chen',
    admin_email: 'sophie.chen@projectlink.com',
    action: 'project_deleted',
    target_type: 'project',
    target_id: 'proj456',
    target_name: 'App Mobile Suspect',
    details: { reason: 'Contenu inapproprié', backup_created: true },
    ip_address: '192.168.1.101',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    created_at: '2024-01-15T13:15:00Z',
    severity: 'critical'
  },
  {
    id: '3',
    admin_id: 'admin1',
    admin_name: 'Jean Dupont',
    admin_email: 'jean.dupont@projectlink.com',
    action: 'settings_updated',
    target_type: 'settings',
    target_name: 'Security Settings',
    details: { 
      changes: { 
        max_login_attempts: { from: 3, to: 5 },
        session_timeout: { from: 12, to: 24 }
      }
    },
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    created_at: '2024-01-15T12:00:00Z',
    severity: 'medium'
  },
  {
    id: '4',
    admin_id: 'admin3',
    admin_name: 'Alex Rivera',
    admin_email: 'alex.rivera@projectlink.com',
    action: 'admin_created',
    target_type: 'admin',
    target_id: 'admin4',
    target_name: 'Emma Wilson',
    details: { role: 'moderator', permissions: ['read_users', 'moderate_content'] },
    ip_address: '192.168.1.102',
    user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    created_at: '2024-01-15T11:30:00Z',
    severity: 'high'
  },
  {
    id: '5',
    admin_id: 'admin2',
    admin_name: 'Sophie Chen',
    admin_email: 'sophie.chen@projectlink.com',
    action: 'user_verified',
    target_type: 'user',
    target_id: 'user789',
    target_name: 'Thomas Dubois',
    details: { verification_type: 'manual', documents_checked: true },
    ip_address: '192.168.1.101',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    created_at: '2024-01-15T10:45:00Z',
    severity: 'low'
  }
];

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterTimeRange, setFilterTimeRange] = useState<string>("24h");
  const { user } = useAuth();

  const filteredLogs = useMemo(() => {
    return mockAuditLogs.filter(log => {
      const matchesSearch = !searchQuery || 
        log.admin_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.target_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.admin_email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAction = filterAction === "all" || log.action.includes(filterAction);
      const matchesSeverity = filterSeverity === "all" || log.severity === filterSeverity;
      
      // Filtrage par période (simulation)
      const now = new Date();
      const logDate = new Date(log.created_at);
      const diffHours = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60);
      
      let matchesTimeRange = true;
      switch (filterTimeRange) {
        case '1h':
          matchesTimeRange = diffHours <= 1;
          break;
        case '24h':
          matchesTimeRange = diffHours <= 24;
          break;
        case '7d':
          matchesTimeRange = diffHours <= 168;
          break;
        case '30d':
          matchesTimeRange = diffHours <= 720;
          break;
      }

      return matchesSearch && matchesAction && matchesSeverity && matchesTimeRange;
    });
  }, [mockAuditLogs, searchQuery, filterAction, filterSeverity, filterTimeRange]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Faible</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Moyen</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Élevé</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Critique</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('user_suspended') || action.includes('user_banned')) {
      return <Ban className="h-4 w-4 text-red-500" />;
    }
    if (action.includes('user_verified')) {
      return <UserCheck className="h-4 w-4 text-green-500" />;
    }
    if (action.includes('deleted')) {
      return <Trash2 className="h-4 w-4 text-red-500" />;
    }
    if (action.includes('settings')) {
      return <Settings className="h-4 w-4 text-blue-500" />;
    }
    if (action.includes('admin')) {
      return <Shield className="h-4 w-4 text-purple-500" />;
    }
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  const getActionLabel = (action: string) => {
    const actionLabels: Record<string, string> = {
      'user_suspended': 'Utilisateur suspendu',
      'user_banned': 'Utilisateur banni',
      'user_verified': 'Utilisateur vérifié',
      'project_deleted': 'Projet supprimé',
      'project_featured': 'Projet mis en avant',
      'admin_created': 'Administrateur créé',
      'admin_deleted': 'Administrateur supprimé',
      'settings_updated': 'Paramètres modifiés',
      'system_backup': 'Sauvegarde système',
      'api_key_generated': 'Clé API générée'
    };
    return actionLabels[action] || action.replace('_', ' ');
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)} jour(s)`;
  };

  const exportLogs = () => {
    const csvData = [
      ['Date', 'Administrateur', 'Action', 'Cible', 'Sévérité', 'IP', 'Détails'],
      ...filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString('fr-FR'),
        log.admin_name,
        getActionLabel(log.action),
        log.target_name || '-',
        log.severity,
        log.ip_address,
        JSON.stringify(log.details)
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    
    toast.success('Logs d\'audit exportés');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logs d'Audit"
        subtitle="Traçabilité complète des actions administratives"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button onClick={exportLogs} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        }
      />

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actions Aujourd'hui</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-muted-foreground">+12% vs hier</p>
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
              <CardTitle className="text-sm font-medium">Actions Critiques</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">3</div>
              <p className="text-xs text-muted-foreground">Cette semaine</p>
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
              <CardTitle className="text-sm font-medium">Administrateurs Actifs</CardTitle>
              <User className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Dernières 24h</p>
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
              <CardTitle className="text-sm font-medium">Rétention Logs</CardTitle>
              <Database className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">90j</div>
              <p className="text-xs text-muted-foreground">Politique actuelle</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par admin, action ou cible..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Type d'action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                <SelectItem value="user">Actions utilisateurs</SelectItem>
                <SelectItem value="project">Actions projets</SelectItem>
                <SelectItem value="admin">Actions admin</SelectItem>
                <SelectItem value="settings">Paramètres</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sévérité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
                <SelectItem value="medium">Moyen</SelectItem>
                <SelectItem value="high">Élevé</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTimeRange} onValueChange={setFilterTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Dernière heure</SelectItem>
                <SelectItem value="24h">Dernières 24h</SelectItem>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table des logs */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date/Heure</TableHead>
              <TableHead>Administrateur</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Cible</TableHead>
              <TableHead>Sévérité</TableHead>
              <TableHead>IP</TableHead>
              <TableHead className="text-right">Détails</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log, index) => (
              <motion.tr
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50"
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">
                        {new Date(log.created_at).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleTimeString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {log.admin_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{log.admin_name}</div>
                      <div className="text-xs text-gray-500">{log.admin_email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getActionIcon(log.action)}
                    <span className="text-sm">{getActionLabel(log.action)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {log.target_name ? (
                    <div>
                      <div className="font-medium text-sm">{log.target_name}</div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {log.target_type}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {getSeverityBadge(log.severity)}
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {log.ip_address}
                  </code>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredLogs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Aucun log d'audit trouvé pour les critères sélectionnés</p>
        </div>
      )}
    </div>
  );
}