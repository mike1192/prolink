import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  Users, 
  FolderOpen, 
  Heart, 
  MessageSquare, 
  RefreshCw,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAnalytics } from "../../hooks/useAdminActions";
import { useDashboardStats } from "@/hooks/useRealTimeData";

export default function Analytics() {
  const [period, setPeriod] = useState("30");
  
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useAnalytics(period);
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const handleRefresh = () => {
    refetchAnalytics();
    toast.success("Analytics actualisées");
  };

  const exportAnalytics = () => {
    if (!analytics) return;
    
    const csvData = [
      ['Date', 'Nouveaux Utilisateurs', 'Nouveaux Projets'],
      ...analytics.userGrowth.map((item: any, index: number) => [
        item.date,
        item.new_users,
        analytics.projectGrowth[index]?.new_projects || 0
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${period}j-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    
    toast.success("Analytics exportées");
  };

  const isLoading = analyticsLoading || statsLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Analyse détaillée de l'activité de la plateforme"
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
                <SelectItem value="365">1 an</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button onClick={exportAnalytics} variant="outline" size="sm" disabled={!analytics}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        }
      />

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs Totaux</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {isLoading ? "..." : (stats?.totalUsers || 0).toLocaleString()}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                +{analytics?.userGrowth?.reduce((acc: number, item: any) => acc + item.new_users, 0) || 0} sur {period}j
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projets Totaux</CardTitle>
              <FolderOpen className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {isLoading ? "..." : (stats?.totalProjects || 0).toLocaleString()}
              </div>
              <p className="text-xs text-green-600 mt-1">
                +{analytics?.projectGrowth?.reduce((acc: number, item: any) => acc + item.new_projects, 0) || 0} sur {period}j
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-pink-200 bg-pink-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Likes Totaux</CardTitle>
              <Heart className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-700">
                {isLoading ? "..." : (stats?.totalLikes || 0).toLocaleString()}
              </div>
              <p className="text-xs text-pink-600 mt-1">
                Engagement élevé
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commentaires</CardTitle>
              <MessageSquare className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">
                {isLoading ? "..." : (stats?.totalComments || 0).toLocaleString()}
              </div>
              <p className="text-xs text-purple-600 mt-1">
                Communauté active
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Graphiques de croissance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Croissance des Utilisateurs
              </CardTitle>
              <CardDescription>
                Nouveaux utilisateurs par jour sur les {period} derniers jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : analytics?.userGrowth?.length > 0 ? (
                <div className="space-y-4">
                  {analytics.userGrowth.slice(-7).map((item: any, index: number) => (
                    <div key={item.date} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.date).toLocaleDateString('fr-FR')}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min(100, (item.new_users / Math.max(...analytics.userGrowth.map((u: any) => u.new_users))) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">
                          {item.new_users}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Croissance des Projets
              </CardTitle>
              <CardDescription>
                Nouveaux projets par jour sur les {period} derniers jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : analytics?.projectGrowth?.length > 0 ? (
                <div className="space-y-4">
                  {analytics.projectGrowth.slice(-7).map((item: any, index: number) => (
                    <div key={item.date} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.date).toLocaleDateString('fr-FR')}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min(100, (item.new_projects / Math.max(...analytics.projectGrowth.map((p: any) => p.new_projects))) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">
                          {item.new_projects}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top compétences et projets populaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Top Compétences
              </CardTitle>
              <CardDescription>
                Compétences les plus demandées sur la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : analytics?.topSkills?.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topSkills.slice(0, 8).map((skill: any, index: number) => (
                    <div key={skill.skill} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground w-4">
                          #{index + 1}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {skill.skill}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-1.5">
                          <div 
                            className="bg-primary h-1.5 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${(skill.count / analytics.topSkills[0].count) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium w-8 text-right">
                          {skill.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Projets Populaires
              </CardTitle>
              <CardDescription>
                Projets avec le plus d'engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : analytics?.popularProjects?.length > 0 ? (
                <div className="space-y-4">
                  {analytics.popularProjects.slice(0, 6).map((project: any, index: number) => (
                    <div key={project.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <span className="text-xs font-mono text-muted-foreground mt-1">
                        #{index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {project.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          par {project.owner_name}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-pink-600">
                            <Heart className="h-3 w-3" />
                            {project.likes_count}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-blue-600">
                            <MessageSquare className="h-3 w-3" />
                            {project.comments_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
