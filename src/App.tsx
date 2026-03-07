import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import { Navigate } from "react-router-dom";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import ApiKeys from "./pages/ApiKeys";
import JobHistory from "./pages/JobHistory";
import JobDetail from "./pages/JobDetail";
import Billing from "./pages/Billing";
import SubmitJob from "./pages/SubmitJob";
import ApiDocs from "./pages/ApiDocs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Navigate to="/login" replace />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/docs" element={<ApiDocs />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="api-keys" element={<ApiKeys />} />
              <Route path="jobs" element={<JobHistory />} />
              <Route path="jobs/:jobId" element={<JobDetail />} />
              <Route path="billing" element={<Billing />} />
              <Route path="submit" element={<SubmitJob />} />
              <Route path="docs" element={<ApiDocs />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
