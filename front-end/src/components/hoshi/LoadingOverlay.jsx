import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function LoadingOverlay({ message = "Connecting to orbital backend..." }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 gap-4"
    >
      <div className="relative">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <div className="absolute inset-0 w-8 h-8 rounded-full bg-primary/20 animate-ping" />
      </div>
      <p className="text-sm font-mono text-muted-foreground animate-pulse">{message}</p>
    </motion.div>
  );
}