import { motion } from "framer-motion";

export default function GlassPanel({ title, children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={`glass rounded-xl border border-border/30 overflow-hidden ${className}`}
    >
      {title && (
        <div className="px-5 py-3 border-b border-border/30 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <h3 className="text-xs font-orbitron font-semibold uppercase tracking-wider text-foreground">{title}</h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </motion.div>
  );
}