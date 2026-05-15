import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Download, 
  RefreshCw, 
  Calendar,
  TrendingUp,
  Users,
  FolderOpen,
  Activity,
  BarChart3,
  PieChart,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useReports } from "../../hooks/useAdminActions";

export default function Reports() {
  const [period, setPeriod] = useState("7");
  const [reportType, setReportType] = useState<"activity" | "users" | "projects" | "engagement">("activity");
  
  const { data: reportData, isLoading, refetch } = useReports(period);

  const handleRefresh = () => {
    refetch();
    toast.success("Rapport actualisé");
  };

  const generateReport = () => {
    if (!reportData) return;
    
    const reportContent = {
      activity: generateActivityReport(),
      users: generateUsersReport(),
      projects: generateProjectsReport(),
      engagement: generateEngagementReport()
    };

    const content = reportContent[reportType];
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${reportType}-${period}j-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    
    toast.success("Rapport généré et téléchargé");
  };

  const generateActivityReport = () => {
    if (!reportData?.report) return "";
    
    const userActivity = reportData.report.filter((item: any) => item.type === 'users');
    const projectActivity = reportData.report.filter((item: any) => item.type === 'projects');
    const likeActivity = reportData.report.filter((item: any) => item.type === 'likes');
    
    return `
RAPPORT D'ACTIVITÉ - ${period} DERNIERS JOURS
Généré le ${new Date().toLocaleString('fr-FR')}

=== RÉSUMÉ EXÉCUTIF ===
Période analysée: ${period} jours
Total nouveaux utilisateurs: ${userActivity.reduce((acc: number, item: any) => acc + item.count, 0)}
Total nouveaux projets: ${projectActivity.reduce((acc: number, item: any) => acc + item.count, 0)}
Total nouveaux likes: ${likeActivity.reduce((acc: number, item: any) => acc + item.count, 0)}

=== DÉTAIL PAR JOUR ===
${reportData.report.map((item: any) => 
  `${item.date} - ${item.type}: ${item.count}`
).join('\n')}

=== ANALYSE ===
- Croissance utilisateurs: ${userActivity.length > 1 ? 
  ((userActivity[userActivity.length - 1]?.count - userActivity[0]?.count) / userActivity[0]?.count * 100).toFixed(1) + '%' : 
  'N/A'}
- Croissance projets: ${projectActivity.length > 1 ? 
  ((projectActivity[projectActivity.length - 1]?.count - projectActivity[0]?.count) / projectActivity[0]?.count * 100).toFixed(1) + '%' : 
  'N/A'}
- Engagement moyen: ${likeActivity.length > 0 ? 
  (likeActivity.reduce((acc: number, item: any) => acc + item.count, 0) / likeActivity.length).toFixed(1) + ' likes/jour' : 
  'N/A'}
`;
  };

  const generateUsersReport = () => {
    return `
RAPPORT UTILISATEURS - ${period} DERNIERS JOURS
Généré le ${new Date().toLocaleString('fr-FR')}

=== MÉTRIQUES UTILISATEURS ===
Ce rapport nécessite des données utilisateurs détaillées.
Fonctionnalité en cours de développement.
`;
  };

  const generateProjectsReport = () => {
    return `
RAPPORT PROJETS - ${period} DERNIERS JOURS
Généré le ${new Date().toLocaleString('fr-FR')}

=== MÉTRIQUES PROJETS ===
Ce rapport nécessite des données projets détaillées.
Fonctionnalité en cours de développement.
`;
  };

  const generateEngagementReport = () => {
    return `
RAPPORT ENGAGEMENT - ${period} DERNIERS JOURS
Généré le ${new Date().toLocaleString('fr-FR')}

=== MÉTRIQUES ENGAGEMENT ===
Ce rapport nécessite des données d'engagement détaillées.
Fonctionnalité en cours de développement.
`;
  };

  const reportTypes = [
    { value: "activity", label: "Activité Générale", icon: Activity, color: "blue" },
    { value: "users", label: "Utilisateurs", icon: Users, color: "green" },
    { value: "projects", label: "Projets", icon: FolderOpen, color: "purple" },
    { value: "engagement", label: "Engagement", icon: TrendingUp, color: "pink" }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapports"
        description="Génération de rapports détaillés sur l'activité de la plateforme"
        action={
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 jours</SelectItem>
                <SelectItem value="30">30 jours</SelectItem>
                <SelectItem value="90">90 jours</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button onClick={generateReport} size="sm" disabled={!reportData}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>
        }
      />

      {/* Sélection du type de rapport */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = reportType === type.value;
          
          return (
            <motion.div
              key={type.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={`cursor-pointer transition-all ${
                  isSelected 
                    ? `border-${type.color}-500 bg-${type.color}-50/50 shadow-md` 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setReportType(type.value as any)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{type.label}</CardTitle>
                  <Icon className={`h-4 w-4 ${isSelected ? `text-${type.color}-600` : 'text-muted-foreground'}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    {isSelected ? "Rapport sélectionné" : "Cliquer pour sélectionner"}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Aperçu du rapport */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Aperçu du Rapport - {reportTypes.find(t => t.value === reportType)?.label}
          </CardTitle>
          <CardDescription>
            Données pour les {period} derniers jours
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reportData?.report ? (
            <div className="space-y-6">
              {/* Métriques rapides */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Utilisateurs</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {reportData.report.filter((item: any) => item.type === 'users')
                      .reduce((acc: number, item: any) => acc + item.count, 0)}
                  </div>
                  <div className="text-xs text-blue-600">nouveaux utilisateurs</div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Projets</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {reportData.report.filter((item: any) => item.type === 'projects')
                      .reduce((acc: number, item: any) => acc + item.count, 0)}
                  </div>
                  <div className="text-xs text-green-600">nouveaux projets</div>
                </div>

                <div className="bg-pink-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-pink-600" />
                    <span className="text-sm font-medium text-pink-900">Engagement</span>
                  </div>
                  <div className="text-2xl font-bold text-pink-700">
                    {reportData.report.filter((item: any) => item.type === 'likes')
                      .reduce((acc: number, item: any) => acc + item.count, 0)}
                  </div>
                  <div className="text-xs text-pink-600">nouveaux likes</div>
                </div>
              </div>

              {/* Graphique d'activité */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Activité par jour
                </h4>
                
                {['users', 'projects', 'likes'].map((type) => {
                  const typeData = reportData.report.filter((item: any) => item.type === type);
                  const maxValue = Math.max(...typeData.map((item: any) => item.count));
                  const color = type === 'users' ? 'blue' : type === 'projects' ? 'green' : 'pink';
                  
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{type}</span>
                        <Badge variant="outline" className={`text-${color}-600`}>
                          {typeData.reduce((acc: number, item: any) => acc + item.count, 0)} total
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {typeData.slice(-7).map((item: any) => (
                          <div key={`${type}-${item.date}`} className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-20">
                              {new Date(item.date).toLocaleDateString('fr-FR', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className={`bg-${color}-500 h-2 rounded-full transition-all duration-500`}
                                style={{ 
                                  width: `${maxValue > 0 ? (item.count / maxValue) * 100 : 0}%` 
                                }}
                              />
                            </div>
                            <span className="text-xs font-medium w-8 text-right">
                              {item.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Résumé textuel */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Résumé de la période
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Période analysée: {period} jours</p>
                  <p>• Rapport généré le: {new Date().toLocaleString('fr-FR')}</p>
                  <p>• Type de rapport: {reportTypes.find(t => t.value === reportType)?.label}</p>
                  <p>• Données disponibles: {reportData.report.length} entrées</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Aucune donnée disponible pour cette période
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
