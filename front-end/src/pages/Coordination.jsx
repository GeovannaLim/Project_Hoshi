import { motion } from "framer-motion";
import { Network, Users, Link, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useCoordinate } from "@/lib/useHoshiData";
import GlassPanel from "@/components/hoshi/GlassPanel";
import MetricCard from "@/components/hoshi/MetricCard";
import LoadingOverlay from "@/components/hoshi/LoadingOverlay";

const STATUS_COLORS = {
  active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  pending: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  offline: "text-red-400 bg-red-500/10 border-red-500/20",
  synced: "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

const STATUS_ICONS = {
  active: CheckCircle2,
  pending: Clock,
  offline: AlertCircle,
  synced: Link,
};

export default function Coordination() {
  const { data: coord, isLoading } = useCoordinate();

  const nodes = coord?.nodes ?? coord?.agents ?? coord?.participants ?? [];
  const isArray = Array.isArray(nodes);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
        className="relative w-full rounded-xl overflow-hidden" style={{ height: 120 }}>
        <img src="https://media.base44.com/images/public/69ff5cddeac91471114596cf/c01ce4d1f_ChatGPTImage1demaide202603_00_49.png"
          alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" style={{ objectPosition: "center 40%" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center h-full px-6">
          <h1 className="font-orbitron text-2xl font-bold text-glow">Decentralized Coordination</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Multi-agent consensus & orbital relay network</p>
        </div>
      </motion.div>

      {isLoading ? <LoadingOverlay message="Syncing coordination layer..." /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Network Status"
              value={coord?.network_status ?? coord?.status ?? "—"}
              icon={Network}
              color={coord?.status === "active" ? "green" : "yellow"}
            />
            <MetricCard
              label="Active Nodes"
              value={isArray ? nodes.length : (coord?.active_nodes ?? "—")}
              icon={Users}
              color="primary"
            />
            <MetricCard
              label="Consensus"
              value={coord?.consensus ?? coord?.consensus_level ?? "—"}
              icon={CheckCircle2}
              color="green"
            />
            <MetricCard
              label="Sync Rate"
              value={coord?.sync_rate ?? coord?.synchronization_rate ?? "—"}
              icon={Link}
              color="primary"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassPanel title="Coordination State" delay={0.1}>
              {coord ? (
                <div className="space-y-2">
                  {Object.entries(coord).filter(([k]) => !["nodes", "agents", "participants"].includes(k)).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center py-1.5 border-b border-border/20 last:border-0">
                      <span className="text-xs font-mono text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                      <span className="text-xs font-mono text-foreground font-medium">
                        {typeof val === "object" ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No coordination data</p>}
            </GlassPanel>

            <GlassPanel title="Network Nodes" delay={0.2}>
              {isArray && nodes.length > 0 ? (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {nodes.map((node, i) => {
                    const status = node?.status ?? "active";
                    const Icon = STATUS_ICONS[status] ?? CheckCircle2;
                    return (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${STATUS_COLORS[status] ?? "text-foreground bg-secondary/30 border-border/30"}`}>
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-mono font-medium">{node?.name ?? node?.id ?? `Node ${i + 1}`}</p>
                            {node?.type && <p className="text-xs text-muted-foreground">{node.type}</p>}
                          </div>
                        </div>
                        <span className={`text-xs font-mono px-2 py-1 rounded-full border`}>{status}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {coord && Object.keys(coord).length > 0 ? (
                    Object.entries(coord).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-3 p-3 glass rounded-lg border border-border/20">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-mono text-muted-foreground capitalize flex-1">{key.replace(/_/g, " ")}</span>
                        <span className="text-xs font-mono text-primary font-medium">
                          {typeof val === "object" ? JSON.stringify(val) : String(val)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No node data available</p>
                  )}
                </div>
              )}
            </GlassPanel>
          </div>
        </>
      )}
    </div>
  );
}