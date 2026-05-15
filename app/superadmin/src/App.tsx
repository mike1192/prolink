import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminLayout from "./components/admin/AdminLayout";
import LoginPage from "./components/auth/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import Projects from "./pages/admin/Projects";
import Interactions from "./pages/admin/Interactions";
import Reports from "./pages/admin/Reports";
import Messages from "./pages/admin/Messages";
import Analytics from "./pages/admin/Analytics";
import AIInsights from "./pages/admin/AIInsights";
import Badges from "./pages/admin/Badges";
import Landing from "./pages/admin/Landing";
import Admins from "./pages/admin/Admins";
import Settings from "./pages/admin/Settings";
import AuditLogs from "./pages/admin/AuditLogs";
import SystemMonitoring from "./pages/admin/SystemMonitoring";
import Notifications from "./pages/admin/Notifications";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter 
        basename="/superadmin"
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/interactions" element={<Interactions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/ai" element={<AIInsights />} />
            <Route path="/badges" element={<Badges />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/admins" element={<Admins />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/system-monitoring" element={<SystemMonitoring />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
