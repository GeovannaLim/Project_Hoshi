import { useState } from "react";
import { motion } from "framer-motion";
import { Play, RotateCcw, Zap, Navigation } from "lucide-react";
import { useOrbitState } from "@/lib/useHoshiData";
import GlassPanel from "@/components/hoshi/GlassPanel";
import MetricCard from "@/components/hoshi/MetricCard";
import LoadingOverlay from "@/components/hoshi/LoadingOverlay";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const DELTA_V_OPTIONS = [0.1, 0.5, 1.0, 2.5, 5.0];

export default function ManeuverSimulation() {
  const { data: orbit, isLoading } = useOrbitState();
  const [deltaV, setDeltaV] = useState(1.0);
  const [angle, setAngle] = useState(0);
  const [simResult, setSimResult] = useState(null);
  const [running, setRunning] = useState(false);

  const runSimulation = () => {
    setRunning(true);
    setSimResult(null);
    setTimeout(() => {
      const baseAlt = orbit?.altitude_km ?? 400;
      const newAlt = baseAlt + deltaV * Math.cos((angle * Math.PI) / 180) * 2.5;
      const fuelCost = deltaV * 12.4;
      const points = Array.from({ length: 20 }, (_, i) => ({
        t: i,
        alt: baseAlt + (newAlt - baseAlt) * (i / 19) + Math.sin(i * 0.5) * (deltaV * 0.3),
      }));
      setSimResult({ newAlt, fuelCost, points, deltaV, angle });
      setRunning(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
        className="relative w-full rounded-xl overflow-hidden" style={{ height: 120 }}>
        <img src="https://media.base44.com/images/public/69ff5cddeac91471114596cf/daef23675_ChatGPTImage1demaide202603_56_18.png"
          alt="" className="absolute inset-0 w-full h-full object-cover opacity-45" style={{ objectPosition: "center 30%" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center h-full px-6">
          <h1 className="font-orbitron text-2xl font-bold text-glow">Maneuver Simulation</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Delta-V planning & orbital trajectory modeling</p>
        </div>
      </motion.div>

      {isLoading ? <LoadingOverlay /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Current Altitude" value={`${orbit?.altitude_km?.toFixed(1) ?? "—"} km`} icon={Navigation} color="primary" />
            <MetricCard label="Inclination" value={`${orbit?.inclination?.toFixed(2) ?? "—"}°`} icon={RotateCcw} color="primary" />
            <MetricCard label="Period" value={orbit?.period ?? orbit?.orbital_period ?? "—"} icon={Zap} color="primary" />
            <MetricCard label="Eccentricity" value={orbit?.eccentricity?.toFixed(4) ?? "—"} icon={Navigation} color="primary" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassPanel title="Maneuver Parameters" delay={0.1}>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 block">
                    Delta-V (m/s): <span className="text-primary">{deltaV}</span>
                  </label>
                  <input
                    type="range" min="0.1" max="10" step="0.1"
                    value={deltaV}
                    onChange={e => setDeltaV(parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between mt-1">
                    {DELTA_V_OPTIONS.map(v => (
                      <button key={v} onClick={() => setDeltaV(v)}
                        className={`text-xs font-mono px-2 py-1 rounded transition-colors ${deltaV === v ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 block">
                    Burn Angle (°): <span className="text-primary">{angle}</span>
                  </label>
                  <input
                    type="range" min="0" max="360" step="5"
                    value={angle}
                    onChange={e => setAngle(parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs font-mono text-muted-foreground mt-1">
                    <span>0°</span><span>90°</span><span>180°</span><span>270°</span><span>360°</span>
                  </div>
                </div>

                <button
                  onClick={runSimulation}
                  disabled={running}
                  className="w-full flex items-center justify-center gap-2 bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors rounded-lg px-4 py-3 font-orbitron text-sm font-semibold disabled:opacity-50"
                >
                  {running ? <><Play className="w-4 h-4 animate-pulse" /> Running...</> : <><Play className="w-4 h-4" /> Run Simulation</>}
                </button>
              </div>
            </GlassPanel>

            <GlassPanel title="Trajectory Preview" className="lg:col-span-2" delay={0.2}>
              {simResult ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="glass rounded-lg p-3">
                      <p className="text-xs font-mono text-muted-foreground mb-1">New Altitude</p>
                      <p className="text-lg font-orbitron font-bold text-primary">{simResult.newAlt.toFixed(1)} km</p>
                    </div>
                    <div className="glass rounded-lg p-3">
                      <p className="text-xs font-mono text-muted-foreground mb-1">Fuel Cost</p>
                      <p className="text-lg font-orbitron font-bold text-amber-400">{simResult.fuelCost.toFixed(1)} kg</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={simResult.points}>
                      <CartesianGrid stroke="hsl(215 25% 12%)" strokeDasharray="4 4" />
                      <XAxis dataKey="t" tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }} label={{ value: "Time", position: "insideBottom", fill: "hsl(215 20% 55%)", fontSize: 10 }} />
                      <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }} domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ background: "hsl(220 25% 7%)", border: "1px solid hsl(215 25% 15%)", borderRadius: 8, fontSize: 11, fontFamily: "JetBrains Mono" }} />
                      <Line type="monotone" dataKey="alt" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center">
                    <Navigation className="w-6 h-6 text-primary/50" />
                  </div>
                  <p className="text-sm font-mono text-muted-foreground">Configure parameters and run simulation</p>
                </div>
              )}
            </GlassPanel>
          </div>
        </>
      )}
    </div>
  );
}