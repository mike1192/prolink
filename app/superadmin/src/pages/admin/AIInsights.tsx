import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge as UiBadge } from "@/components/ui/badge";
import {
  Sparkles, TrendingUp, AlertTriangle, Lightbulb, ShieldAlert, Users as UsersIcon,
  ArrowRight, Activity, Zap, Flag, Award,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import {
  users, projects, reports, comments, engagementData, growthData, trendingCategories,
} from "@/lib/mock-data";
import { useBadges } from "@/lib/badges-store";

type Insight = {
  id: string;
  icon: any;
  color: string;
  tag: string;
  severity: "info" | "warning" | "critical" | "growth";
  title: string;
  desc: string;
  metric?: { label: string; value: string };
  actions: { label: string; to?: string; primary?: boolean }[];
};

function severityClass(s: Insight["severity"]) {
  if (s === "critical") return "border-destructive/40 text-destructive";
  if (s === "warning") return "border-warning/40 text-warning";
  if (s === "growth") return "border-success/40 text-success";
  return "border-neon-blue/40 text-neon-blue";
}

export default function AIInsights() {
  const navigate = useNavigate();
  const { badges, assignments } = useBadges();

  const insights = useMemo<Insight[]>(() => {
    const totalUsers = users.length;
    const verifiedRatio = users.filter((u) => u.verified).length / totalUsers;
    const inactivePublishers = users.filter((u) => u.projects === 0).length;
    const flaggedComments = comments.filter((c) => c.flagged).length;
    const flaggedRatio = flaggedComments / comments.length;
    const featuredProjects = projects.filter((p) => p.featured);
    const avgFeaturedLikes = featuredProjects.reduce((s, p) => s + p.likes, 0) / Math.max(featuredProjects.length, 1);
    const avgOtherLikes = projects.filter((p) => !p.featured).reduce((s, p) => s + p.likes, 0) / Math.max(projects.length - featuredProjects.length, 1);
    const featuredUplift = ((avgFeaturedLikes - avgOtherLikes) / Math.max(avgOtherLikes, 1)) * 100;
    const last = growthData[growthData.length - 1];
    const prev = growthData[growthData.length - 2];
    const userGrowth = ((last.users - prev.users) / prev.users) * 100;
    const topCategory = [...trendingCategories].sort((a, b) => b.value - a.value)[0];
    const highSeverityReports = reports.filter((r) => r.severity === "high").length;
    const last3 = engagementData.slice(-3).reduce((s, d) => s + d.likes + d.comments, 0);
    const prev3 = engagementData.slice(0, 3).reduce((s, d) => s + d.likes + d.comments, 0);
    const engagementDelta = ((last3 - prev3) / prev3) * 100;

    const out: Insight[] = [];

    out.push({
      id: "growth",
      icon: TrendingUp, color: "text-success", tag: "Croissance", severity: "growth",
      title: `Acquisition utilisateurs +${userGrowth.toFixed(1)}% MoM`,
      desc: `${last.users.toLocaleString()} utilisateurs ce mois, principalement portés par la catégorie ${topCategory.name}. Lancez une campagne ciblée pour capitaliser.`,
      metric: { label: "Nouveaux utilisateurs", value: `+${(last.users - prev.users).toLocaleString()}` },
      actions: [
        { label: "Voir analytics", to: "/analytics", primary: true },
        { label: "Exporter cohorte", to: "/users" },
      ],
    });

    if (flaggedRatio > 0.2) {
      out.push({
        id: "moderation",
        icon: ShieldAlert, color: "text-destructive", tag: "Modération", severity: "critical",
        title: `Pic de signalements : ${(flaggedRatio * 100).toFixed(0)}% de commentaires flaggés`,
        desc: `${highSeverityReports} signalements à haute sévérité ouverts. Activez le filtre auto et triez la file de modération.`,
        metric: { label: "Signalements high", value: String(highSeverityReports) },
        actions: [
          { label: "Ouvrir la file", to: "/reports", primary: true },
          { label: "Voir interactions", to: "/interactions" },
        ],
      });
    }

    out.push({
      id: "featured",
      icon: Sparkles, color: "text-neon-pink", tag: "Algorithme", severity: "growth",
      title: `Featured génère +${featuredUplift.toFixed(0)}% d'engagement`,
      desc: `Les ${featuredProjects.length} projets featured cumulent ${avgFeaturedLikes.toFixed(0)} likes moyens vs ${avgOtherLikes.toFixed(0)} pour les autres. Augmentez le quota hebdo de 5 → 8.`,
      metric: { label: "Likes moyens", value: avgFeaturedLikes.toFixed(0) },
      actions: [
        { label: "Régler le quota", to: "/settings", primary: true },
        { label: "Curating projets", to: "/projects" },
      ],
    });

    out.push({
      id: "category",
      icon: Activity, color: "text-neon-violet", tag: "Tendance", severity: "info",
      title: `${topCategory.name} domine avec ${topCategory.value}% des publications`,
      desc: `Cette catégorie pèse ${topCategory.value}% du volume. Créez un hub dédié sur la landing pour augmenter la rétention.`,
      actions: [
        { label: "Activer la section", to: "/landing", primary: true },
      ],
    });

    if (verifiedRatio < 0.5) {
      out.push({
        id: "verify",
        icon: UsersIcon, color: "text-neon-blue", tag: "Confiance", severity: "warning",
        title: `Seulement ${(verifiedRatio * 100).toFixed(0)}% d'utilisateurs vérifiés`,
        desc: `Lancez une campagne de vérification ciblant les top contributeurs pour booster la crédibilité.`,
        actions: [
          { label: "Filtrer non vérifiés", to: "/users", primary: true },
          { label: "Créer badge Verified", to: "/badges" },
        ],
      });
    }

    out.push({
      id: "onboarding",
      icon: Lightbulb, color: "text-warning", tag: "Onboarding", severity: "warning",
      title: `${inactivePublishers} utilisateurs n'ont jamais publié`,
      desc: `Soit ${((inactivePublishers / totalUsers) * 100).toFixed(0)}% de la base. Ajoutez un quickstart guidé et un email d'activation à J+3.`,
      actions: [
        { label: "Voir utilisateurs inactifs", to: "/users", primary: true },
      ],
    });

    out.push({
      id: "engagement",
      icon: Zap, color: "text-neon-pink", tag: "Engagement", severity: engagementDelta >= 0 ? "growth" : "warning",
      title: `Engagement ${engagementDelta >= 0 ? "+" : ""}${engagementDelta.toFixed(1)}% sur 7 jours`,
      desc: `Les pics se concentrent en fin de semaine. Programmez les annonces et features Vendredi 18h pour maximiser la visibilité.`,
      metric: { label: "Δ engagement", value: `${engagementDelta >= 0 ? "+" : ""}${engagementDelta.toFixed(1)}%` },
      actions: [
        { label: "Voir engagement", to: "/analytics", primary: true },
      ],
    });

    if (badges.length > 0 && assignments.length / Math.max(users.length, 1) < 0.3) {
      out.push({
        id: "badges",
        icon: Award, color: "text-neon-violet", tag: "Gamification", severity: "info",
        title: `Sous-utilisation des badges (${assignments.length} attributions)`,
        desc: `${badges.length} badges existent mais peu sont attribués. Automatisez l'attribution sur des seuils (ex: 10 projets → Top Creator).`,
        actions: [
          { label: "Gérer les badges", to: "/badges", primary: true },
        ],
      });
    }

    if (highSeverityReports > 0) {
      out.push({
        id: "spam",
        icon: Flag, color: "text-destructive", tag: "Sécurité", severity: "critical",
        title: `${highSeverityReports} signalements critiques en attente`,
        desc: `Traitez en priorité — risque de churn et impact réputationnel. SLA recommandé < 4h.`,
        actions: [
          { label: "Traiter maintenant", to: "/reports", primary: true },
        ],
      });
    }

    return out;
  }, [badges, assignments]);

  const critical = insights.filter((i) => i.severity === "critical").length;
  const opportunities = insights.filter((i) => i.severity === "growth").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Insights"
        subtitle="Recommandations actionnables générées à partir de vos données en temps réel"
      />

      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-neon-pink/10 p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full gradient-primary opacity-30 blur-3xl" />
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">Résumé IA · cette semaine</h2>
            <p className="text-xs text-muted-foreground">Analyse basée sur {users.length} utilisateurs · {projects.length} projets · {comments.length + reports.length} signaux modération</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed mt-3 max-w-3xl">
          <span className="gradient-text font-bold">{insights.length} recommandations</span> détectées dont
          <span className="text-destructive font-semibold"> {critical} critiques</span> et
          <span className="text-success font-semibold"> {opportunities} opportunités</span> de croissance.
          Concentrez-vous sur les actions critiques en priorité.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insights.map((it, i) => (
          <motion.div
            key={it.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            className="rounded-xl border border-border bg-card card-shadow p-5 group flex flex-col"
          >
            <div className="flex items-start gap-3">
              <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center ${it.color} shrink-0`}>
                <it.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <UiBadge variant="outline" className={`text-[9px] uppercase tracking-wider ${severityClass(it.severity)}`}>
                    {it.severity}
                  </UiBadge>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{it.tag}</span>
                </div>
                <h3 className="font-semibold leading-snug">{it.title}</h3>
                <p className="text-sm text-muted-foreground mt-1.5">{it.desc}</p>
              </div>
            </div>

            {it.metric && (
              <div className="mt-4 rounded-lg bg-secondary/40 border border-border px-3 py-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{it.metric.label}</span>
                <span className="font-display font-bold text-sm">{it.metric.value}</span>
              </div>
            )}

            <div className="mt-4 flex gap-2 flex-wrap">
              {it.actions.map((a) => (
                <Button
                  key={a.label}
                  size="sm"
                  variant={a.primary ? "default" : "outline"}
                  className={`gap-1 ${a.primary ? "gradient-primary text-primary-foreground border-0" : ""}`}
                  onClick={() => a.to && navigate(a.to)}
                >
                  {a.label} <ArrowRight className="h-3 w-3" />
                </Button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
