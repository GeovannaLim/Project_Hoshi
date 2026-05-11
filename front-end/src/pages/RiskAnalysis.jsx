import { motion } from "framer-motion";
import { ShieldAlert, TrendingUp, Radar, AlertTriangle } from "lucide-react";
import { useRisk, useSpaceWeather } from "@/lib/useHoshiData";
import MetricCard from "@/components/hoshi/MetricCard";
import GlassPanel from "@/components/hoshi/GlassPanel";
import LoadingOverlay from "@/components/hoshi/LoadingOverlay";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar as ReRadar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

function RiskScore({ score }) {
  const pct = typeof score === "number" ? Math.min(score * 10, 100) : 0;
  const color = pct < 30 ? "#22c55e" : pct < 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(215 25% 15%)" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="52" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={`${pct / 100 * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }} />
          
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-orbitron text-2xl font-bold" style={{ color }}>{typeof score === "number" ? score.toFixed(1) : "—"}</span>
          <span className="text-xs font-mono text-muted-foreground">/ 10</span>
        </div>
      </div>
      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Composite Risk Score</span>
    </div>);

}

export default function RiskAnalysis() {
  const { data: risk, isLoading: riskLoading } = useRisk();
  const { data: weather, isLoading: weatherLoading } = useSpaceWeather();

  const radarData = risk ? [
  { subject: "Collision", value: (risk.collision_risk ?? 0) * 10 },
  { subject: "Radiation", value: (risk.radiation_risk ?? 0) * 10 },
  { subject: "Debris", value: (risk.debris_risk ?? 0) * 10 },
  { subject: "Thermal", value: (risk.thermal_risk ?? 0) * 10 },
  { subject: "Power", value: (risk.power_risk ?? 0) * 10 }] :
  [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
      className="relative w-full rounded-xl overflow-hidden" style={{ height: 120 }}>
        <img src="https://media.base44.com/images/public/69ff5cddeac91471114596cf/a5a51ef39_ChatGPTImage1demaide202603_10_11.png"
        alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center h-full px-6">
          <h1 className="font-orbitron text-2xl font-bold text-glow">Orbital Risk Analysis</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Threat assessment & space weather monitoring</p>
        </div>
      </motion.div>

      {riskLoading ? <LoadingOverlay message="Calculating risk vectors..." /> :
      <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Collision Risk" value={risk?.collision_risk?.toFixed(2) ?? "—"} icon={AlertTriangle} color={(risk?.collision_risk ?? 0) > 0.5 ? "red" : "green"} />
            <MetricCard label="Debris Risk" value={risk?.debris_risk?.toFixed(2) ?? "—"} icon={Radar} color={(risk?.debris_risk ?? 0) > 0.5 ? "yellow" : "green"} />
            <MetricCard label="Radiation Risk" value={risk?.radiation_risk?.toFixed(2) ?? "—"} icon={ShieldAlert} color={(risk?.radiation_risk ?? 0) > 0.5 ? "red" : "green"} />
            <MetricCard label="Overall Status" value={risk?.status ?? "—"} icon={TrendingUp} color={risk?.status === "safe" ? "green" : "yellow"} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassPanel title="Risk Radar" delay={0.1}>
              <RiskScore score={risk?.composite_risk ?? risk?.overall_risk} />
              {radarData.length > 0 &&
            <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(215 25% 15%)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(215 20% 55%)", fontSize: 11, fontFamily: "JetBrains Mono" }} />
                    <ReRadar name="Risk" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
            }
            </GlassPanel>

            <GlassPanel title="Space Weather" delay={0.2}>
              {weatherLoading ? <LoadingOverlay message="Fetching space weather..." /> : weather ?
            <div className="space-y-3">
                  {Object.entries(weather).map(([key, val]) =>
              <div key={key} className="flex justify-between items-center py-1.5 border-b border-border/20 last:border-0">
                      <span className="text-xs font-mono text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                      <span className="text-xs font-mono text-foreground font-medium">
                        {typeof val === "object" ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
              )}
                </div> :
            <p className="text-sm text-muted-foreground">No weather data available</p>}
            </GlassPanel>
          </div>

          <GlassPanel title="Full Risk Report" delay={0.3}>
            {risk ?
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(risk).map(([key, val]) =>
            <div key={key} className="glass p-3 rounded">
                    <p className="text-xs font-mono text-muted-foreground capitalize mb-1">{key.replace(/_/g, " ")}</p>
                    <p className="text-sm font-mono text-foreground font-semibold">
                      {typeof val === "number" ? val.toFixed(4) : String(val)}
                    </p>
                  </div>
            )}
              </div> :
          null}
          </GlassPanel>
        </>
      }
    </div>);

}