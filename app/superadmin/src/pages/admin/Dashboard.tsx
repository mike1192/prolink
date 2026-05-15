import { Users, FolderKanban, Heart, Activity, RefreshCw } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboardStats, useRecentActivity, useWebSocketUpdates } from "@/hooks/useRealTimeData";
import { useQueryClient } from "@tanstack/react-query";
import { engagementData, growthData, trendingCategories } from "@/lib/mock-data";

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();
  
  // Activer les mises à jour WebSocket
  useWebSocketUpdates();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Vue d'ensemble de la plateforme Projectlink en temps réel."
        action={
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={statsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Utilisateurs" 
          value={statsLoading ? "..." : formatNumber(stats?.totalUsers || 0)} 
          delta={stats?.userGrowth || 0} 
          icon={Users} 
          accent="violet" 
          index={0} 
        />
        <StatCard 
          label="Projets publiés" 
          value={statsLoading ? "..." : formatNumber(stats?.totalProjects || 0)} 
          delta={stats?.projectGrowth || 0} 
          icon={FolderKanban} 
          accent="blue" 
          index={1} 
        />
        <StatCard 
          label="Projets actifs" 
          value={statsLoading ? "..." : formatNumber(stats?.activeProjects || 0)} 
          delta={4.6} 
          icon={Activity} 
          accent="primary" 
          index={2} 
        />
        <StatCard 
          label="Interactions" 
          value={statsLoading ? "..." : formatNumber(stats?.totalInteractions || 0)} 
          delta={stats?.interactionGrowth || 0} 
          icon={Heart} 
          accent="pink" 
          index={3} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-xl border border-border bg-card card-shadow p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold">Croissance</h3>
              <p className="text-xs text-muted-foreground">Utilisateurs, projets & interactions / mois</p>
            </div>
            <Badge variant="outline" className="text-[10px] border-success/40 text-success">Live</Badge>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gInter" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--neon-pink))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--neon-pink))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="url(#gUsers)" strokeWidth={2} />
              <Area type="monotone" dataKey="interactions" stroke="hsl(var(--neon-pink))" fill="url(#gInter)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card card-shadow p-5">
          <h3 className="font-display font-semibold mb-1">Activité récente</h3>
          <p className="text-xs text-muted-foreground mb-4">Derniers événements plateforme</p>
          <div className="space-y-3 max-h-[280px] overflow-auto scrollbar-thin pr-1">
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : activity && activity.length > 0 ? (
              activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/40 transition">
                  <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
                    {a.who.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="text-xs leading-relaxed">
                    <span className="font-semibold">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.what}</span>{" "}
                    {a.target && <span className="text-primary">{a.target}</span>}
                    <div className="text-[10px] text-muted-foreground mt-0.5">il y a {a.time}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Aucune activité récente
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-xl border border-border bg-card card-shadow p-5">
          <h3 className="font-display font-semibold mb-1">Engagement hebdomadaire</h3>
          <p className="text-xs text-muted-foreground mb-4">Likes, commentaires & partages</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={engagementData}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--accent) / 0.3)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="likes" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
              <Bar dataKey="comments" fill="hsl(var(--neon-blue))" radius={[6,6,0,0]} />
              <Bar dataKey="shares" fill="hsl(var(--neon-pink))" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card card-shadow p-5">
          <h3 className="font-display font-semibold mb-1">Catégories tendance</h3>
          <p className="text-xs text-muted-foreground mb-4">Sur les dernières 24h</p>
          <div className="space-y-3">
            {trendingCategories.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">{c.value}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full transition-all"
                    style={{ width: `${c.value * 2.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
