import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import HoshiLayout from "@/components/layout/HoshiLayout";
// Add page imports here
import Dashboard from "@/pages/Dashboard";
import RiskAnalysis from "@/pages/RiskAnalysis";
import HoshiCopilot from "@/pages/HoshiCopilot";
import ManeuverSimulation from "@/pages/ManeuverSimulation";
import Coordination from "@/pages/Coordination";
import SolanaNetwork from "@/pages/SolanaNetwork";

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-mono text-muted-foreground tracking-wider animate-pulse">HOSHI INITIALIZING...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === "user_not_registered") return <UserNotRegisteredError />;
    if (authError.type === "auth_required") { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route element={<HoshiLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/risk" element={<RiskAnalysis />} />
        <Route path="/copilot" element={<HoshiCopilot />} />
        <Route path="/maneuver" element={<ManeuverSimulation />} />
        <Route path="/coordination" element={<Coordination />} />
        <Route path="/solana" element={<SolanaNetwork />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;