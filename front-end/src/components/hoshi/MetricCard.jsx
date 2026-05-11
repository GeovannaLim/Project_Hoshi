import { motion } from "framer-motion";

export default function MetricCard({ label, value, icon: Icon, color = "primary", subtitle, className = "" }) {
  const colorMap = {
    primary: "text-primary border-primary/20 bg-primary/5",
    green: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    red: "text-red-400 border-red-500/20 bg-red-500/5",
    yellow: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    purple: "text-violet-400 border-violet-500/20 bg-violet-500/5",
  };

  const iconColorMap = {
    primary: "text-primary bg-primary/10",
    green: "text-emerald-400 bg-emerald-500/10",
    red: "text-red-400 bg-red-500/10",
    yellow: "text-amber-400 bg-amber-500/10",
    purple: "text-violet-400 bg-violet-500/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`glass rounded-xl border ${colorMap[color]} p-4 ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColorMap[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="text-2xl font-orbitron font-bold">{value ?? "—"}</div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </motion.div>
  );
}