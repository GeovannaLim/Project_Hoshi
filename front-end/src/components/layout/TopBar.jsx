import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { useBackendHealth } from "@/lib/useHoshiData";

export default function TopBar() {
  const [utcTime, setUtcTime] = useState("");
  const { data: health, isError } = useBackendHealth();
  const isOnline = health && !isError;

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setUtcTime(
        now.toISOString().replace("T", "  ").substring(0, 21) + " UTC"
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 glass-strong border-b border-border/30 flex items-center justify-between px-6 z-40 relative">
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs text-muted-foreground tracking-wider">
          {utcTime}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono ${
          isOnline 
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
        }`}>
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3" />
              <span>ONLINE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-glow" />
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              <span>CONNECTING...</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            </>
          )}
        </div>
      </div>
    </header>
  );
}