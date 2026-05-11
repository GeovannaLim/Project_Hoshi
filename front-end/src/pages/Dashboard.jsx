import { motion } from "framer-motion";
import { Activity, Satellite, AlertTriangle, Zap, Globe, Clock } from "lucide-react";
import { useMissionState, useFrontendState, useOrbitState } from "@/lib/useHoshiData";
import { useWebSocket } from "@/lib/useWebSocket";
import MetricCard from "@/components/hoshi/MetricCard";
import GlassPanel from "@/components/hoshi/GlassPanel";
import LoadingOverlay from "@/components/hoshi/LoadingOverlay";
import OrbitalGlobe from "@/components/dashboard/OrbitalGlobe";

export default function Dashboard() {
  const { data: mission, isLoading: missionLoading } = useMissionState();
  const { data: frontend } = useFrontendState();
  const { data: orbit } = useOrbitState();
  const { wsData, isConnected } = useWebSocket();

  const live = wsData || {};

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative w-full rounded-xl overflow-hidden"
        style={{ height: 140 }}>
        
        <img
          src="https://media.base44.com/images/public/69ff5cddeac91471114596cf/1a92a85fe_ChatGPTImage1demaide202603_56_18.png"
          alt="Orbital background"
          className="absolute inset-0 w-full h-full object-cover opacity-50" />
        
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
        <div className="relative z-10 flex items-center h-full px-6 gap-4">
          



          
          
          <div>
            <h1 className="font-orbitron text-2xl font-bold text-glow text-foreground">Mission Dashboard</h1>
            <p className="text-sm text-muted-foreground font-mono mt-0.5">Real-time orbital telemetry & mission status</p>
          </div>
        </div>
      </motion.div>

      {missionLoading ?
      <LoadingOverlay /> :

      <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
            label="Mission Phase"
            value={mission?.mission_phase ?? live?.mission_phase ?? "—"}
            icon={Satellite}
            color="primary" />
          
            <MetricCard
            label="System Status"
            value={mission?.status ?? live?.status ?? "—"}
            icon={Activity}
            color={mission?.status === "nominal" ? "green" : "yellow"} />
          
            <MetricCard
            label="Altitude (km)"
            value={orbit?.altitude_km?.toFixed(1) ?? live?.altitude_km?.toFixed(1) ?? "—"}
            icon={Globe}
            color="primary"
            subtitle="Above sea level" />
          
            <MetricCard
            label="Active Alerts"
            value={frontend?.alerts?.length ?? "0"}
            icon={AlertTriangle}
            color={(frontend?.alerts?.length ?? 0) > 0 ? "red" : "green"} />
          
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Globe */}
            <GlassPanel title="Orbital View" className="lg:col-span-2" delay={0.1}>
              <OrbitalGlobe />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                <span className="text-xs font-mono text-muted-foreground">WebSocket</span>
                <div className={`flex items-center gap-2 text-xs font-mono ${isConnected ? "text-emerald-400" : "text-amber-400"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-amber-400"} animate-pulse`} />
                  {isConnected ? "LIVE FEED" : "RECONNECTING"}
                </div>
              </div>
            </GlassPanel>

            {/* Mission State Detail */}
            <GlassPanel title="Mission State" delay={0.2}>
              {mission ?
            <div className="space-y-3">
                  {Object.entries(mission).slice(0, 8).map(([key, val]) =>
              <div key={key} className="flex justify-between items-center py-1.5 border-b border-border/20 last:border-0">
                      <span className="text-xs font-mono text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                      <span className="text-xs font-mono text-foreground font-medium truncate max-w-[120px]">
                        {typeof val === "object" ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
              )}
                </div> :

            <p className="text-sm text-muted-foreground">No data available</p>
            }
            </GlassPanel>
          </div>

          {/* Live WS feed + Orbit details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassPanel title="Live Telemetry Feed" delay={0.3}>
              {wsData ?
            <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Object.entries(wsData).map(([key, val]) =>
              <div key={key} className="flex justify-between items-center py-1 border-b border-border/20 last:border-0">
                      <span className="text-xs font-mono text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                      <span className="text-xs font-mono text-primary font-medium">
                        {typeof val === "object" ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
              )}
                </div> :

            <p className="text-sm font-mono text-muted-foreground animate-pulse">Waiting for live data...</p>
            }
            </GlassPanel>

            <GlassPanel title="Orbit Parameters" delay={0.4}>
              {orbit ?
            <div className="space-y-2">
                  {Object.entries(orbit).map(([key, val]) =>
              <div key={key} className="flex justify-between items-center py-1.5 border-b border-border/20 last:border-0">
                      <span className="text-xs font-mono text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                      <span className="text-xs font-mono text-foreground font-medium">
                        {typeof val === "number" ? val.toFixed(3) : String(val)}
                      </span>
                    </div>
              )}
                </div> :

            <LoadingOverlay message="Loading orbit data..." />
            }
            </GlassPanel>
          </div>
        </>
      }
    </div>);

}