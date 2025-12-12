import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Strategies from "./pages/Strategies";
import Positions from "./pages/Positions";
import ActivityLog from "./pages/ActivityLog";
import Settings from "./pages/Settings";
import Backtesting from "./pages/Backtesting";
import Optimization from "./pages/Optimization";
import Analytics from "./pages/Analytics";
import Notifications from "./pages/Notifications";
import TradeJournal from "./pages/TradeJournal";
import Marketplace from "./pages/Marketplace";
import AIInsights from "./pages/AIInsights";
import Team from "./pages/Team";
import Deployment from "./pages/Deployment";
import BrokerSettings from "./pages/BrokerSettings";
import Profile from "./pages/Profile";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/strategies" element={<ProtectedRoute><Strategies /></ProtectedRoute>} />
            <Route path="/positions" element={<ProtectedRoute><Positions /></ProtectedRoute>} />
            <Route path="/activity" element={<ProtectedRoute><ActivityLog /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/backtesting" element={<ProtectedRoute><Backtesting /></ProtectedRoute>} />
            <Route path="/optimization" element={<ProtectedRoute><Optimization /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/journal" element={<ProtectedRoute><TradeJournal /></ProtectedRoute>} />
            <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
            <Route path="/ai-insights" element={<ProtectedRoute><AIInsights /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
            <Route path="/deployment" element={<ProtectedRoute><Deployment /></ProtectedRoute>} />
            <Route path="/brokers" element={<ProtectedRoute><BrokerSettings /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
