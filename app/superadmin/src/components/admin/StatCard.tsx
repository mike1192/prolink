import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

export function StatCard({
  label, value, delta, icon: Icon, accent = "primary", index = 0,
}: {
  label: string; value: string; delta?: number; icon: LucideIcon;
  accent?: "primary" | "pink" | "blue" | "violet"; index?: number;
}) {
  const accentMap = {
    primary: "from-primary/20 to-primary/0 text-primary",
    pink: "from-neon-pink/20 to-neon-pink/0 text-neon-pink",
    blue: "from-neon-blue/20 to-neon-blue/0 text-neon-blue",
    violet: "from-neon-violet/20 to-neon-violet/0 text-neon-violet",
  } as const;
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="relative rounded-xl border border-border bg-card card-shadow p-5 overflow-hidden group"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${accentMap[accent]} opacity-50 group-hover:opacity-100 transition`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-2xl md:text-3xl font-bold">{value}</div>
          {delta !== undefined && (
            <div className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${positive ? "text-success" : "text-destructive"}`}>
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {positive ? "+" : ""}{delta}% ce mois
            </div>
          )}
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center bg-background/60 border border-border ${accentMap[accent]?.split(" ").pop() || 'text-primary'}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
