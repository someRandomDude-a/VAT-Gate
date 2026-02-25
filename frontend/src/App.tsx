import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import TrackingPage from "@/pages/TrackingPage";
import RoutePlannerPage from "@/pages/RoutePlannerPage";
import VATAnalysisPage from "@/pages/VATAnalysisPage";
import AboutPage from "@/pages/AboutPage";
import IndiaComingSoonPage from "@/pages/IndiaComingSoonPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
              <Route path="/tracking" element={<ProtectedRoute><AppLayout><TrackingPage /></AppLayout></ProtectedRoute>} />
              <Route path="/route-planner" element={<ProtectedRoute><AppLayout><RoutePlannerPage /></AppLayout></ProtectedRoute>} />
              <Route path="/vat-analysis" element={<ProtectedRoute><AppLayout><VATAnalysisPage /></AppLayout></ProtectedRoute>} />
              <Route path="/india" element={<ProtectedRoute><AppLayout><IndiaComingSoonPage /></AppLayout></ProtectedRoute>} />
              <Route path="/about" element={<ProtectedRoute><AppLayout><AboutPage /></AppLayout></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
