import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ShieldAlert, Bot, Navigation, Network, Coins, ChevronLeft, ChevronRight } from
"lucide-react";

const NAV = [
{ label: "Dashboard", path: "/", icon: LayoutDashboard },
{ label: "Risk Analysis", path: "/risk", icon: ShieldAlert },
{ label: "HOSHI Copilot", path: "/copilot", icon: Bot },
{ label: "Maneuver Sim", path: "/maneuver", icon: Navigation },
{ label: "Coordination", path: "/coordination", icon: Network },
{ label: "Solana Network", path: "/solana", icon: Coins }];


export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-full z-50 glass-strong border-r border-border/30 flex flex-col overflow-hidden">
      
      {/* Branding */}
      <div className="h-16 flex items-center px-3 border-b border-border/30 flex-shrink-0">
        





        
        <AnimatePresence>
          {!collapsed &&
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="ml-2 font-orbitron text-sm font-bold tracking-widest whitespace-nowrap text-[hsl(var(--foreground))]">
            
              HOSHI星
            </motion.span>
          }
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-hidden">
        {NAV.map(({ label, path, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
              active ?
              "bg-primary/10 border border-primary/20 text-primary" :
              "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`
              }>
              
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-primary" : ""}`} />
              <AnimatePresence>
                {!collapsed &&
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-xs font-mono font-medium whitespace-nowrap">
                  
                    {label}
                  </motion.span>
                }
              </AnimatePresence>
              {active &&
              <motion.div
                layoutId="activeIndicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />

              }
            </Link>);

        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-border/30 flex-shrink-0">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
          
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>);

}